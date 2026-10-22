import React, { useState, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import type { ImageUpscalerWorkerApi } from '../workers/image.worker';
import { Dropzone } from './Dropzone';
import { ComparisonSlider } from './ComparisonSlider';
import { ProgressBar } from './ProgressBar';
import { AlertCircle, Sliders, Zap } from 'lucide-react';
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

  const workerRef = useRef<Worker | null>(null);
  const workerApiRef = useRef<Comlink.Remote<ImageUpscalerWorkerApi> | null>(null);

  useEffect(() => {
    // Inicializar Web Worker
    const worker = new Worker(new URL('../workers/image.worker.ts', import.meta.url), {
      type: 'module',
    });
    const api = Comlink.wrap<ImageUpscalerWorkerApi>(worker);
    workerRef.current = worker;
    workerApiRef.current = api;

    // Warmup en segundo plano para pre-cargar pesos
    api.warmup().catch((e) => console.warn('Warmup background error:', e));

    return () => {
      worker.terminate();
    };
  }, []);

  const handleFileSelected = (selectedFile: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setFile(selectedFile);
    setResultUrl(null);
    setError(null);
    setProgress(0);

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

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(1);
      setStageName('loading');
      setStageLabel('Iniciando inferencia...');

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
        <div className="w-full max-w-2xl bg-[#0e1222] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-slate-700">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                  {dimensions ? `${dimensions.width}×${dimensions.height} px` : 'Cargando...'}
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              disabled={isProcessing}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cambiar imagen
            </button>
          </div>

          {/* Factor selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Factor de Escala IA</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScaleFactor(2)}
                disabled={isProcessing}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  scaleFactor === 2
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400 shadow-md shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>2x Resolución</span>
                {dimensions && (
                  <span className="text-[11px] font-normal opacity-80">
                    {dimensions.width * 2}×{dimensions.height * 2}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScaleFactor(4)}
                disabled={isProcessing}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-between transition ${
                  scaleFactor === 4
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400 shadow-md shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>4x Ultra HD</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono">
                    Nativo
                  </span>
                </div>
                {dimensions && (
                  <span className="text-[11px] font-normal opacity-80">
                    {dimensions.width * 4}×{dimensions.height * 4}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Processing progress or trigger button */}
          {isProcessing ? (
            <ProgressBar
              progress={progress}
              stageLabel={stageLabel}
              stageName={stageName}
            />
          ) : (
            <button
              onClick={startUpscaling}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Escalar Imagen con Real-ESRGAN {scaleFactor}x</span>
            </button>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

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
          />
        </div>
      )}
    </div>
  );
};
