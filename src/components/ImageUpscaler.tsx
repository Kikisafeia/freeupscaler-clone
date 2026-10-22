import React, { useState, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import type { ImageUpscalerWorkerApi } from '../workers/image.worker';
import { Dropzone } from './Dropzone';
import { ComparisonSlider } from './ComparisonSlider';
import { ProgressBar } from './ProgressBar';
import { AlertCircle, Sliders, Zap, Check, Sparkles } from 'lucide-react';
import type { ScaleFactor } from '../types/worker';

export const ImageUpscaler: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resultDimensions, setResultDimensions] = useState<{ width: number; height: number } | null>(null);

  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageName, setStageName] = useState<string>('idle');
  const [stageLabel, setStageLabel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const workerApiRef = useRef<Comlink.Remote<ImageUpscalerWorkerApi> | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
      type: 'module',
    });
    const api = Comlink.wrap<ImageUpscalerWorkerApi>(worker);
    workerRef.current = worker;
    workerApiRef.current = api;

    api.warmup().catch((e) => console.warn('Warmup background error:', e));

    return () => {
      worker.terminate();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileSelected = (selectedFile: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setFile(selectedFile);
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setInferenceTimeMs(undefined);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const startUpscaling = async () => {
    if (!file || !workerApiRef.current) return;

    const startTime = performance.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((performance.now() - startTime) / 1000);
    }, 100);

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(1);
      setStageName('loading');
      setStageLabel('Iniciando tensores neuronales...');

      const arrayBuffer = await file.arrayBuffer();

      const onProgressProxy = Comlink.proxy((p: any) => {
        setProgress(p.progress);
        setStageName(p.stage);
        if (p.label) setStageLabel(p.label);
      });

      const outBuffer = await workerApiRef.current.upscale(
        arrayBuffer,
        scaleFactor,
        onProgressProxy,
      );

      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);
      setInferenceTimeMs(totalTime);

      const outBlob = new Blob([outBuffer], { type: 'image/png' });
      const outUrl = URL.createObjectURL(outBlob);
      setResultUrl(outUrl);

      if (dimensions) {
        setResultDimensions({
          width: dimensions.width * scaleFactor,
          height: dimensions.height * scaleFactor,
        });
      }
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Error al escalar imagen:', err);
      setError(err?.message || 'Ocurrió un error inesperado al procesar la imagen.');
      setIsProcessing(false);
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setDimensions(null);
    setResultDimensions(null);
    setProgress(0);
    setError(null);
    setInferenceTimeMs(undefined);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {!file && (
        <div className="w-full max-w-2xl">
          <Dropzone
            type="image"
            accept={['image/png', 'image/jpeg', 'image/webp']}
            maxSizeBytes={30 * 1024 * 1024}
            onFileSelected={handleFileSelected}
          />
        </div>
      )}

      {file && !resultUrl && (
        <div className="w-full max-w-2xl bg-[#0d1124] p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col gap-6">
          {/* File summary header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 overflow-hidden border border-white/10 shadow-md">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                  {dimensions ? (
                    <span className="text-slate-300 font-mono">
                      {dimensions.width}×{dimensions.height} px
                    </span>
                  ) : (
                    'Calculando dimensiones...'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              disabled={isProcessing}
              className="text-xs text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-white/[0.06] disabled:opacity-50"
            >
              Cambiar
            </button>
          </div>

          {/* Scale Factor Selection */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Factor de Escala Neuronal</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Real-ESRGAN v3
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setScaleFactor(2)}
                disabled={isProcessing}
                className={`p-4 rounded-2xl border text-left transition relative overflow-hidden ${
                  scaleFactor === 2
                    ? 'border-blue-500 bg-blue-600/[0.08] text-white shadow-lg shadow-blue-500/10'
                    : 'border-white/[0.06] bg-[#090d1f] text-slate-400 hover:border-white/20'
                }`}
              >
                {scaleFactor === 2 && (
                  <span className="absolute top-3 right-3 text-blue-400">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div className="font-bold text-base text-white">2x Resolución</div>
                <p className="text-xs text-slate-400 mt-1">
                  Ideal para fotos estándar y avatares web.
                </p>
                {dimensions && (
                  <div className="mt-2.5 text-[11px] font-mono text-blue-400/90 font-medium">
                    → {dimensions.width * 2}×{dimensions.height * 2} px
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScaleFactor(4)}
                disabled={isProcessing}
                className={`p-4 rounded-2xl border text-left transition relative overflow-hidden ${
                  scaleFactor === 4
                    ? 'border-blue-500 bg-blue-600/[0.08] text-white shadow-lg shadow-blue-500/10'
                    : 'border-white/[0.06] bg-[#090d1f] text-slate-400 hover:border-white/20'
                }`}
              >
                {scaleFactor === 4 && (
                  <span className="absolute top-3 right-3 text-blue-400">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">4x Ultra HD</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                    Nativo
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Máxima nitidez para impresiones y wallpapers.
                </p>
                {dimensions && (
                  <div className="mt-2.5 text-[11px] font-mono text-blue-400/90 font-medium">
                    → {dimensions.width * 4}×{dimensions.height * 4} px
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Trigger or Progress Bar */}
          {isProcessing ? (
            <ProgressBar
              progress={progress}
              stageLabel={stageLabel}
              stageName={stageName}
              elapsedSeconds={elapsed}
            />
          ) : (
            <button
              onClick={startUpscaling}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
            >
              <Zap className="w-4 h-4 fill-current text-white" />
              <span>Escalar Imagen con Real-ESRGAN {scaleFactor}x</span>
              <Sparkles className="w-4 h-4 text-blue-200" />
            </button>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {resultUrl && previewUrl && (
        <div className="w-full max-w-4xl">
          <ComparisonSlider
            originalUrl={previewUrl}
            resultUrl={resultUrl}
            originalDimensions={dimensions ?? undefined}
            resultDimensions={resultDimensions ?? undefined}
            scaleFactor={scaleFactor}
            onReset={resetAll}
            fileName={`upscaled-${scaleFactor}x-${file?.name || 'image.png'}`}
            inferenceTimeMs={inferenceTimeMs}
          />
        </div>
      )}
    </div>
  );
};
