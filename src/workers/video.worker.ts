import * as Comlink from 'comlink';
import WebSR from '@websr/websr';
import type { NetworkName } from '@websr/websr/dist/networks/network_list';
import {
  Input,
  BlobSource,
  ALL_FORMATS,
  Output,
  BufferTarget,
  Mp4OutputFormat,
  CanvasSource,
  VideoSampleSink,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  QUALITY_HIGH,
  canEncodeVideo,
} from 'mediabunny';
import type { VideoProgress, ScaleFactor } from '../types/worker';

type ProgressCallback = (p: VideoProgress) => void;

const NETWORK_NAME: NetworkName = 'anime4k/cnn-2x-m';

async function fetchWeights(): Promise<any> {
  const url = 'https://cdn.jsdelivr.net/npm/@websr/websr@0.0.15/weights/anime4k/cnn-2x-m-rl.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falló la descarga de pesos de WebSR: ${res.status}`);
  return await res.json();
}

async function addAudioTrack(
  output: Output,
  audioTrack: Awaited<ReturnType<Input['getPrimaryAudioTrack']>>,
): Promise<{
  audioSource: EncodedAudioPacketSource | null;
  audioSink: EncodedPacketSink | null;
}> {
  const audioCodec = audioTrack ? audioTrack.codec : null;
  if (!audioTrack || !audioCodec) {
    return { audioSource: null, audioSink: null };
  }

  const audioSource = new EncodedAudioPacketSource(audioCodec);
  output.addAudioTrack(audioSource);
  return {
    audioSource,
    audioSink: new EncodedPacketSink(audioTrack),
  };
}

async function copyAudio(
  audioTrack: Awaited<ReturnType<Input['getPrimaryAudioTrack']>>,
  audioSource: EncodedAudioPacketSource | null,
  audioSink: EncodedPacketSink | null,
  onProgress: ProgressCallback,
) {
  if (!audioSource || !audioSink || !audioTrack) return;

  onProgress({ progress: 92, stage: 'copyingAudio', label: 'Copiando pistas de audio original...' });
  const decoderConfig = await audioTrack.getDecoderConfig();
  let firstAudioAdded = false;
  for await (const packet of audioSink.packets()) {
    if (packet.timestamp < 0) continue;
    await audioSource.add(
      packet,
      firstAudioAdded ? undefined : { decoderConfig: decoderConfig ?? undefined },
    );
    firstAudioAdded = true;
  }
}

async function upscaleVideoWithWebGPU({
  videoTrack,
  audioTrack,
  inWidth,
  inHeight,
  frameRate,
  duration,
  scaleFactor,
  gpu,
  weights,
  onProgress,
}: {
  videoTrack: NonNullable<Awaited<ReturnType<Input['getPrimaryVideoTrack']>>>;
  audioTrack: Awaited<ReturnType<Input['getPrimaryAudioTrack']>>;
  inWidth: number;
  inHeight: number;
  frameRate: number;
  duration: number;
  scaleFactor: ScaleFactor;
  gpu: any;
  weights: any;
  onProgress: ProgressCallback;
}): Promise<Blob> {
  const outWidth = inWidth * scaleFactor;
  const outHeight = inHeight * scaleFactor;

  // Pass 1: input -> 2x
  const pass1Canvas = new OffscreenCanvas(inWidth * 2, inHeight * 2);
  const pass1 = new WebSR({
    network_name: NETWORK_NAME,
    weights,
    gpu,
    canvas: pass1Canvas as unknown as HTMLCanvasElement,
    resolution: { width: inWidth, height: inHeight },
  });

  // Pass 2 (4x only): 2x -> 4x
  let pass2: WebSR | null = null;
  let pass2Canvas: OffscreenCanvas | null = null;
  if (scaleFactor === 4) {
    pass2Canvas = new OffscreenCanvas(outWidth, outHeight);
    pass2 = new WebSR({
      network_name: NETWORK_NAME,
      weights,
      gpu,
      canvas: pass2Canvas as unknown as HTMLCanvasElement,
      resolution: { width: inWidth * 2, height: inHeight * 2 },
    });
  }

  const readbackCanvas = new OffscreenCanvas(outWidth, outHeight);
  const readbackCtx = readbackCanvas.getContext('2d', { willReadFrequently: false })!;

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(readbackCanvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate, rotation: videoTrack.rotation });

  const { audioSource, audioSink } = await addAudioTrack(output, audioTrack);

  await output.start();
  onProgress({ progress: 5, stage: 'upscalingFrames', label: 'Procesando fotogramas con WebGPU...' });

  const sampleSink = new VideoSampleSink(videoTrack);
  const sourceCanvas = scaleFactor === 4 ? pass2Canvas! : pass1Canvas;
  let lastReported = 5;

  for await (const sample of sampleSink.samples()) {
    const videoFrame = sample.toVideoFrame();
    try {
      await pass1.render(videoFrame);
      if (scaleFactor === 4) {
        const mid = await createImageBitmap(pass1Canvas);
        try {
          await pass2!.render(mid);
        } finally {
          mid.close();
        }
      }
      readbackCtx.drawImage(sourceCanvas, 0, 0);
      await videoSource.add(sample.timestamp, sample.duration);
    } finally {
      videoFrame.close();
      sample.close();
    }

    if (duration > 0) {
      const pct = 5 + Math.min(85, Math.round((sample.timestamp / duration) * 85));
      if (pct > lastReported) {
        lastReported = pct;
        onProgress({
          progress: pct,
          stage: 'upscalingFrames',
          label: `Escalando video por GPU: ${pct}%`,
        });
      }
    }
  }

  await copyAudio(audioTrack, audioSource, audioSink, onProgress);

  onProgress({ progress: 96, stage: 'finalizing', label: 'Finalizando empaquetado MP4...' });
  await output.finalize();

  await pass1.destroy();
  if (pass2) await pass2.destroy();

  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error('El multiplexor no produjo bytes');

  onProgress({ progress: 100, stage: 'done', label: 'Video escalado con éxito' });
  return new Blob([buffer], { type: 'video/mp4' });
}

async function upscaleVideoWithCanvas({
  videoTrack,
  audioTrack,
  inWidth,
  inHeight,
  frameRate,
  duration,
  scaleFactor,
  onProgress,
}: {
  videoTrack: NonNullable<Awaited<ReturnType<Input['getPrimaryVideoTrack']>>>;
  audioTrack: Awaited<ReturnType<Input['getPrimaryAudioTrack']>>;
  inWidth: number;
  inHeight: number;
  frameRate: number;
  duration: number;
  scaleFactor: ScaleFactor;
  onProgress: ProgressCallback;
}): Promise<Blob> {
  const outWidth = inWidth * scaleFactor;
  const outHeight = inHeight * scaleFactor;
  const canvas = new OffscreenCanvas(outWidth, outHeight);
  const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate, rotation: videoTrack.rotation });

  const { audioSource, audioSink } = await addAudioTrack(output, audioTrack);

  await output.start();
  onProgress({ progress: 5, stage: 'scalingFrames', label: 'Escalando fotogramas (modo compatibilidad)...' });

  const sampleSink = new VideoSampleSink(videoTrack);
  let lastReported = 5;

  for await (const sample of sampleSink.samples()) {
    const videoFrame = sample.toVideoFrame();
    try {
      ctx.clearRect(0, 0, outWidth, outHeight);
      ctx.drawImage(videoFrame, 0, 0, outWidth, outHeight);
      await videoSource.add(sample.timestamp, sample.duration);
    } finally {
      videoFrame.close();
      sample.close();
    }

    if (duration > 0) {
      const pct = 5 + Math.min(85, Math.round((sample.timestamp / duration) * 85));
      if (pct > lastReported) {
        lastReported = pct;
        onProgress({
          progress: pct,
          stage: 'scalingFrames',
          label: `Escalando fotogramas: ${pct}%`,
        });
      }
    }
  }

  await copyAudio(audioTrack, audioSource, audioSink, onProgress);

  onProgress({ progress: 96, stage: 'finalizing', label: 'Finalizando archivo...' });
  await output.finalize();

  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error('El multiplexor no produjo salida');

  onProgress({ progress: 100, stage: 'done', label: 'Video escalado con éxito' });
  return new Blob([buffer], { type: 'video/mp4' });
}

async function checkWebGPUSupport(): Promise<boolean> {
  try {
    const result = await WebSR.initWebGPU();
    if (result === false) return false;
    (result as { destroy(): void }).destroy();
    return true;
  } catch {
    return false;
  }
}

function checkWebCodecsSupport(): boolean {
  return (
    typeof VideoDecoder !== 'undefined' &&
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined'
  );
}

const api = {
  async checkSupport(): Promise<{ webgpu: boolean; webcodecs: boolean }> {
    const webcodecs = checkWebCodecsSupport();
    const webgpu = await checkWebGPUSupport();
    return { webgpu, webcodecs };
  },

  async upscale(
    videoBuffer: ArrayBuffer,
    scaleFactor: ScaleFactor,
    onProgress: ProgressCallback,
  ): Promise<ArrayBuffer> {
    onProgress({ progress: 1, stage: 'loading', label: 'Analizando archivo multimedia...' });

    const videoBlob = new Blob([videoBuffer]);
    const input = new Input({
      formats: ALL_FORMATS,
      source: new BlobSource(videoBlob),
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) throw new Error('No se encontró pista de video en el archivo.');

    const canDecode = await videoTrack.canDecode();
    if (!canDecode) throw new Error('El códec de video no está soportado en este navegador.');

    const audioTrack = await input.getPrimaryAudioTrack();
    const inWidth = videoTrack.codedWidth;
    const inHeight = videoTrack.codedHeight;
    const outWidth = inWidth * scaleFactor;
    const outHeight = inHeight * scaleFactor;

    const canEnc = await canEncodeVideo('avc', {
      width: outWidth,
      height: outHeight,
      bitrate: QUALITY_HIGH,
    });
    if (!canEnc) {
      console.warn(`Resolución ${outWidth}x${outHeight} puede exceder el codificador por hardware.`);
    }

    const packetStats = await videoTrack.computePacketStats(1000);
    const rawRate = packetStats.averagePacketRate;
    const frameRate = rawRate > 0 && rawRate < 240 ? rawRate : 30;
    const duration = await input.computeDuration();

    onProgress({ progress: 3, stage: 'loading', label: 'Inicializando aceleración gráfica...' });

    let gpu: any = false;
    try {
      gpu = await WebSR.initWebGPU();
    } catch (e) {
      console.warn('Fallo initWebGPU:', e);
    }

    let resultBlob: Blob;
    if (gpu !== false) {
      const weights = await fetchWeights();
      resultBlob = await upscaleVideoWithWebGPU({
        videoTrack,
        audioTrack,
        inWidth,
        inHeight,
        frameRate,
        duration,
        scaleFactor,
        gpu,
        weights,
        onProgress,
      });
    } else {
      resultBlob = await upscaleVideoWithCanvas({
        videoTrack,
        audioTrack,
        inWidth,
        inHeight,
        frameRate,
        duration,
        scaleFactor,
        onProgress,
      });
    }

    const outBuffer = await resultBlob.arrayBuffer();
    return Comlink.transfer(outBuffer, [outBuffer]);
  },
};

export type VideoUpscalerWorkerApi = typeof api;

Comlink.expose(api);
