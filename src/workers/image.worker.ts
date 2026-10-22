import * as Comlink from 'comlink';
import { loadModel, upscale, type ProgressEvent, type Scale } from './real-esrgan';
import type { ImageProgress, ProgressStage } from '../types/worker';

type ProgressCallback = (p: ImageProgress) => void;

const PROGRESS_LOAD_END = 30;
const PROGRESS_UPSCALE_END = 95;

const STAGE_MAP: Record<ProgressEvent['stage'], ProgressStage> = {
  loading: 'loading',
  upscaling: 'upscalingImage',
  finalizing: 'finalizing',
};

function eventToProgress(e: ProgressEvent): ImageProgress {
  let pct = 0;
  if (e.stage === 'loading') {
    const f = e.fraction ?? 0;
    pct = Math.round(f * PROGRESS_LOAD_END);
  } else if (e.stage === 'upscaling') {
    const f = e.fraction ?? 0;
    pct = PROGRESS_LOAD_END + Math.round(f * (PROGRESS_UPSCALE_END - PROGRESS_LOAD_END));
  } else {
    pct = PROGRESS_UPSCALE_END + Math.round((e.fraction ?? 0) * (100 - PROGRESS_UPSCALE_END));
  }
  return {
    progress: Math.min(99, pct),
    stage: STAGE_MAP[e.stage],
    label: e.label,
  };
}

let warmupPromise: Promise<void> | null = null;

const api = {
  async warmup(onProgress?: ProgressCallback): Promise<void> {
    if (!warmupPromise) {
      warmupPromise = (async () => {
        try {
          await loadModel({
            onProgress: onProgress ? (e) => onProgress(eventToProgress(e)) : undefined,
          });
        } catch (err) {
          console.warn('[image-upscaler] Falló warmup:', err);
          warmupPromise = null;
        }
      })();
    }
    return warmupPromise;
  },

  async upscale(
    imageBuffer: ArrayBuffer,
    scaleFactor: 2 | 4,
    onProgress: ProgressCallback,
  ): Promise<ArrayBuffer> {
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const bitmap = await createImageBitmap(blob);

    onProgress({ progress: 1, stage: 'loading', label: 'Iniciando motor...' });

    await loadModel({
      onProgress: (e) => onProgress(eventToProgress(e)),
    });

    const resultCanvas = await upscale(bitmap, {
      scale: scaleFactor as Scale,
      onProgress: (e) => onProgress(eventToProgress(e)),
    });
    bitmap.close();

    onProgress({ progress: 97, stage: 'finalizing', label: 'Empaquetando resultado PNG...' });
    const outBlob = await resultCanvas.convertToBlob({ type: 'image/png' });
    const buffer = await outBlob.arrayBuffer();
    onProgress({ progress: 100, stage: 'done', label: 'Completado' });

    return Comlink.transfer(buffer, [buffer]);
  },
};

export type ImageUpscalerWorkerApi = typeof api;

Comlink.expose(api);
