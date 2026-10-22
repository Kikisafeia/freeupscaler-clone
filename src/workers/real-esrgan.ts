import * as ort from 'onnxruntime-web';

export type Scale = 2 | 4;

export interface ProgressEvent {
  stage: 'loading' | 'upscaling' | 'finalizing';
  fraction?: number | null;
  label?: string;
}

export interface LoadModelOptions {
  modelUrl?: string;
  modelDataUrl?: string;
  onProgress?: (e: ProgressEvent) => void;
}

export interface UpscaleOptions {
  scale: Scale;
  onProgress?: (e: ProgressEvent) => void;
  signal?: AbortSignal;
}

interface LoadedModel {
  session: ort.InferenceSession;
  device: 'webgpu' | 'wasm';
  inputName: string;
  outputName: string;
}

let modelPromise: Promise<LoadedModel> | null = null;

async function fetchWithProgress(
  url: string,
  onProgress?: (fraction: number | null) => void,
): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} falló: ${res.status} ${res.statusText}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body?.getReader();
  if (!reader) {
    onProgress?.(1);
    return new Uint8Array(await res.arrayBuffer());
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onProgress?.(total > 0 ? received / total : null);
  }

  const result = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function createSession(
  onnxBytes: Uint8Array,
  dataBytes: Uint8Array,
  dataFileName: string,
): Promise<{ session: ort.InferenceSession; device: 'webgpu' | 'wasm' }> {
  const baseOptions: ort.InferenceSession.SessionOptions = {
    graphOptimizationLevel: 'all',
    externalData: [
      {
        data: dataBytes,
        path: dataFileName,
      },
    ],
  };

  try {
    const session = await ort.InferenceSession.create(onnxBytes, {
      ...baseOptions,
      executionProviders: ['webgpu'],
    });
    return { session, device: 'webgpu' };
  } catch (err) {
    console.warn('[real-esrgan] Creación de sesión WebGPU falló, degradando a WASM:', err);
    const session = await ort.InferenceSession.create(onnxBytes, {
      ...baseOptions,
      executionProviders: ['wasm'],
    });
    return { session, device: 'wasm' };
  }
}

export async function loadModel(options: LoadModelOptions = {}): Promise<LoadedModel> {
  if (!modelPromise) {
    const modelUrl = options.modelUrl ?? '/models/real_esrgan_general_x4v3.onnx';
    const modelDataUrl = options.modelDataUrl ?? '/models/real_esrgan_general_x4v3.data';

    modelPromise = (async () => {
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';
      ort.env.wasm.numThreads = 1;
      ort.env.logLevel = 'warning';

      options.onProgress?.({ stage: 'loading', fraction: 0, label: 'Cargando motor de IA' });
      const onnxBytes = await fetchWithProgress(modelUrl);
      options.onProgress?.({ stage: 'loading', fraction: 0.05, label: 'Cargando pesos del modelo' });

      const dataBytes = await fetchWithProgress(modelDataUrl, (fraction) => {
        options.onProgress?.({
          stage: 'loading',
          fraction: fraction === null ? null : 0.05 + 0.9 * fraction,
          label: 'Descargando modelo neuronal (~4.8MB)',
        });
      });

      options.onProgress?.({ stage: 'loading', fraction: 0.97, label: 'Compilando grafo de tensores' });
      const dataFileName = modelDataUrl.split('/').pop() ?? 'real_esrgan_general_x4v3.data';
      const { session, device } = await createSession(onnxBytes, dataBytes, dataFileName);

      options.onProgress?.({ stage: 'loading', fraction: 1, label: 'Motor listo' });
      return {
        session,
        device,
        inputName: session.inputNames[0],
        outputName: session.outputNames[0],
      };
    })();

    try {
      await modelPromise;
    } catch (err) {
      modelPromise = null;
      throw err;
    }
  }

  return modelPromise;
}

function clamp255(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : val;
}

async function runTile(model: LoadedModel, tileCanvas: OffscreenCanvas): Promise<ImageData> {
  if (tileCanvas.width !== 128 || tileCanvas.height !== 128) {
    throw new Error(`runTile esperaba dimensiones 128x128, recibió ${tileCanvas.width}x${tileCanvas.height}`);
  }

  const ctx = tileCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo obtener contexto 2D para tile');
  const imgData = ctx.getImageData(0, 0, 128, 128);
  const { data, width, height } = imgData;
  const totalPixels = width * height;
  const floatData = new Float32Array(3 * totalPixels);

  // Normalización RGB planar [0, 1] NCHW
  for (let i = 0, p = 0; p < totalPixels; i += 4, p++) {
    floatData[p] = data[i] / 255;
    floatData[totalPixels + p] = data[i + 1] / 255;
    floatData[2 * totalPixels + p] = data[i + 2] / 255;
  }

  const inputTensor = new ort.Tensor('float32', floatData, [1, 3, 128, 128]);
  const results = await model.session.run({ [model.inputName]: inputTensor });
  const outputTensor = results[model.outputName];
  if (!outputTensor) {
    throw new Error(`Falta el tensor de salida "${model.outputName}"`);
  }

  const outDims = outputTensor.dims;
  if (outDims.length !== 4 || outDims[1] !== 3 || outDims[2] !== 512 || outDims[3] !== 512) {
    throw new Error(`Forma de salida inesperada: [${outDims.join(', ')}]`);
  }

  const outData = outputTensor.data as Float32Array;
  const resultImg = new ImageData(512, 512);
  const outPlane = 512 * 512;

  for (let i = 0, p = 0; p < outPlane; i += 4, p++) {
    resultImg.data[i] = clamp255(255 * outData[p]);
    resultImg.data[i + 1] = clamp255(255 * outData[outPlane + p]);
    resultImg.data[i + 2] = clamp255(255 * outData[2 * outPlane + p]);
    resultImg.data[i + 3] = 255;
  }

  return resultImg;
}

function getTileOffsets(size: number): number[] {
  if (size <= 128) return [0];
  const offsets: number[] = [];
  for (let i = 0; i + 128 < size; i += 112) {
    offsets.push(i);
  }
  offsets.push(size - 128);
  return Array.from(new Set(offsets));
}

function cropToSize(canvas: OffscreenCanvas, targetW: number, targetH: number): OffscreenCanvas {
  const scaledW = 4 * targetW;
  const scaledH = 4 * targetH;
  if (canvas.width === scaledW && canvas.height === scaledH) return canvas;
  const cropped = new OffscreenCanvas(scaledW, scaledH);
  const ctx = cropped.getContext('2d');
  ctx?.drawImage(canvas, 0, 0, scaledW, scaledH, 0, 0, scaledW, scaledH);
  return cropped;
}

async function upscaleTiled(
  model: LoadedModel,
  sourceCanvas: OffscreenCanvas,
  onProgress?: (e: ProgressEvent) => void,
  signal?: AbortSignal,
): Promise<OffscreenCanvas> {
  const origW = sourceCanvas.width;
  const origH = sourceCanvas.height;

  let paddedCanvas = sourceCanvas;
  let padW = origW;
  let padH = origH;

  if (origW < 128 || origH < 128) {
    padW = Math.max(origW, 128);
    padH = Math.max(origH, 128);
    paddedCanvas = new OffscreenCanvas(padW, padH);
    const pCtx = paddedCanvas.getContext('2d');
    if (pCtx) {
      pCtx.drawImage(sourceCanvas, 0, 0);
      if (padW > origW) {
        pCtx.drawImage(sourceCanvas, origW - 1, 0, 1, origH, origW, 0, padW - origW, origH);
      }
      if (padH > origH) {
        pCtx.drawImage(paddedCanvas, 0, origH - 1, padW, 1, 0, origH, padW, padH - origH);
      }
    }
  }

  const outW = 4 * padW;
  const outH = 4 * padH;
  const xOffsets = getTileOffsets(padW);
  const yOffsets = getTileOffsets(padH);

  interface TileCoord {
    x: number;
    y: number;
  }

  const coords: TileCoord[] = [];
  for (const y of yOffsets) {
    for (const x of xOffsets) {
      coords.push({ x, y });
    }
  }

  if (coords.length === 1) {
    onProgress?.({ stage: 'upscaling', fraction: 0, label: 'Escalando imagen' });
    const singleTile = new OffscreenCanvas(128, 128);
    singleTile.getContext('2d')?.drawImage(paddedCanvas, 0, 0);
    const singleData = await runTile(model, singleTile);
    const singleOut = new OffscreenCanvas(outW, outH);
    singleOut.getContext('2d')?.putImageData(singleData, 0, 0);
    onProgress?.({ stage: 'upscaling', fraction: 1, label: 'Escalado completado' });
    return cropToSize(singleOut, origW, origH);
  }

  // Máscara trapezoidal de solapamiento para blending suave sin cortes
  const ramp = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    const left = Math.min(i, 64) / 64;
    const right = Math.min(511 - i, 64) / 64;
    ramp[i] = Math.min(left, right, 1);
  }

  const rgbBuffer = new Float32Array(outW * outH * 3);
  const weightBuffer = new Float32Array(outW * outH);

  for (let i = 0; i < coords.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Proceso de escalado abortado', 'AbortError');
    }

    const { x, y } = coords[i];
    onProgress?.({
      stage: 'upscaling',
      fraction: i / coords.length,
      label: `Escalando tesela ${i + 1}/${coords.length}`,
    });

    const tileInput = new OffscreenCanvas(128, 128);
    tileInput.getContext('2d')?.drawImage(paddedCanvas, x, y, 128, 128, 0, 0, 128, 128);

    const tileResult = await runTile(model, tileInput);
    const tileData = tileResult.data;
    const outTileX = 4 * x;
    const outTileY = 4 * y;

    for (let r = 0; r < 512; r++) {
      const destY = outTileY + r;
      if (destY < 0 || destY >= outH) continue;
      const weightY = ramp[r];
      const rowOffset = destY * outW;

      for (let c = 0; c < 512; c++) {
        const destX = outTileX + c;
        if (destX < 0 || destX >= outW) continue;
        const w = weightY * ramp[c];
        if (w <= 0) continue;

        const tilePixelIdx = (512 * r + c) * 4;
        const targetPixelIdx = (rowOffset + destX) * 3;

        rgbBuffer[targetPixelIdx] += tileData[tilePixelIdx] * w;
        rgbBuffer[targetPixelIdx + 1] += tileData[tilePixelIdx + 1] * w;
        rgbBuffer[targetPixelIdx + 2] += tileData[tilePixelIdx + 2] * w;
        weightBuffer[rowOffset + destX] += w;
      }
    }
  }

  const finalCanvas = new OffscreenCanvas(outW, outH);
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('No se pudo inicializar canvas final');
  const finalImageData = finalCtx.createImageData(outW, outH);

  for (let p = 0, byteIdx = 0; p < weightBuffer.length; p++, byteIdx += 4) {
    const totalWeight = weightBuffer[p] || 1;
    const rgbIdx = 3 * p;
    finalImageData.data[byteIdx] = clamp255(rgbBuffer[rgbIdx] / totalWeight);
    finalImageData.data[byteIdx + 1] = clamp255(rgbBuffer[rgbIdx + 1] / totalWeight);
    finalImageData.data[byteIdx + 2] = clamp255(rgbBuffer[rgbIdx + 2] / totalWeight);
    finalImageData.data[byteIdx + 3] = 255;
  }

  finalCtx.putImageData(finalImageData, 0, 0);
  onProgress?.({ stage: 'upscaling', fraction: 1, label: 'Uniendo teselas' });
  return cropToSize(finalCanvas, origW, origH);
}

export async function upscale(
  imageSource: ImageBitmap | HTMLCanvasElement | OffscreenCanvas,
  options: UpscaleOptions,
): Promise<OffscreenCanvas> {
  const model = await loadModel({ onProgress: options.onProgress });

  const canvas = new OffscreenCanvas(imageSource.width, imageSource.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo obtener contexto 2D');
  ctx.drawImage(imageSource, 0, 0);

  const upscaled4x = await upscaleTiled(model, canvas, options.onProgress, options.signal);

  if (options.scale === 4) {
    return upscaled4x;
  }

  // Si scale es 2x, reescalar 4x -> 2x con alta calidad
  options.onProgress?.({ stage: 'finalizing', fraction: 0.95, label: 'Ajustando escala a 2x' });
  const w2 = Math.round(upscaled4x.width / 2);
  const h2 = Math.round(upscaled4x.height / 2);
  const downscaled = new OffscreenCanvas(w2, h2);
  const dCtx = downscaled.getContext('2d');
  if (dCtx) {
    dCtx.imageSmoothingEnabled = true;
    dCtx.imageSmoothingQuality = 'high';
    dCtx.drawImage(upscaled4x, 0, 0, w2, h2);
  }
  return downscaled;
}
