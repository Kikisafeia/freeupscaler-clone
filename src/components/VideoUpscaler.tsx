import React, { useState, useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import type { VideoUpscalerWorkerApi } from '../workers/video.worker';
import { Dropzone } from './Dropzone';
import { ProgressBar } from './ProgressBar';
import { AlertCircle, Sliders, Zap, Download, RotateCcw, Film, CheckCircle2 } from 'lucide-react';
import type { ScaleFactor } from '../types/worker';

export const VideoUpscaler: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageName, setStageName] = useState<string>('idle');
  const [stageLabel, setStageLabel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const workerApiRef = useRef<Comlink.Remote<VideoUpscalerWorkerApi> | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/video.worker.ts', import.meta.url), {
      type: 'module',
    });
    const api = Comlink.wrap<VideoUpscalerWorkerApi>(worker);
    workerRef.current = worker;
    workerApiRef.current = api;

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
  };

  const startUpscaling = async () => {
    if (!file || !workerApiRef.current) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(1);
      setStageName('loading');
      setStageLabel('Iniciando WebCodecs y GPU...');

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

      const outBlob = new Blob([outBuffer], { type: 'video/mp4' });
      const outUrl = URL.createObjectURL(outBlob);
      setResultUrl(outUrl);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Error al escalar video:', err);
      setError(err?.message || 'Ocurrió un error inesperado al procesar el video.');
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {!file && (
        <div className="w-full max-w-2xl">
          <Dropzone
            type="video"
            accept={['video/mp4', 'video/webm', 'video/quicktime']}
            maxSizeBytes={100 * 1024 * 1024}
            onFileSelected={handleFileSelected}
          />
        </div>
      )}

      {file && !resultUrl && (
        <div className="w-full max-w-2xl bg-[#0e1222] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <Film className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Video local
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              disabled={isProcessing}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cambiar video
            </button>
          </div>

          {/* Video Preview */}
          {previewUrl && (
            <div className="w-full rounded-xl overflow-hidden bg-black/50 border border-slate-800 aspect-video max-h-[300px] flex items-center justify-center">
              <video
                src={previewUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          )}

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
                <span className="text-[11px] font-normal opacity-80">Anime4K WebGPU</span>
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
                <span>4x Ultra HD</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono">
                  Doble pasada
                </span>
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
              <span>Escalar Video con WebGPU {scaleFactor}x</span>
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

      {/* Result Display */}
      {resultUrl && (
        <div className="w-full max-w-4xl flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">
                Video escalado {scaleFactor}x listo para descargar
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Subir otro</span>
              </button>
              <a
                href={resultUrl}
                download={`upscaled-${scaleFactor}x-${file?.name || 'video.mp4'}`}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                <span>Descargar MP4</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e1222] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-medium">Video Original</span>
              <div className="aspect-video bg-black/60 rounded-xl overflow-hidden">
                {previewUrl && (
                  <video src={previewUrl} controls playsInline className="w-full h-full object-contain" />
                )}
              </div>
            </div>

            <div className="bg-[#0e1222] p-4 rounded-2xl border border-blue-500/30 flex flex-col gap-2 shadow-lg shadow-blue-500/5">
              <span className="text-xs text-blue-400 font-semibold">Video Escalado ({scaleFactor}x)</span>
              <div className="aspect-video bg-black/60 rounded-xl overflow-hidden">
                <video src={resultUrl} controls playsInline className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
