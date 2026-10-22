import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, RotateCcw, Sparkles, Copy, Check, ZoomIn, Columns, Split, Clock, ArrowRight } from 'lucide-react';

interface ComparisonSliderProps {
  originalUrl: string;
  resultUrl: string;
  originalDimensions?: { width: number; height: number };
  resultDimensions?: { width: number; height: number };
  scaleFactor: number;
  onReset: () => void;
  fileName?: string;
  inferenceTimeMs?: number;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  resultUrl,
  originalDimensions,
  resultDimensions,
  scaleFactor,
  onReset,
  fileName = 'upscaled-image.png',
  inferenceTimeMs,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'side' | 'lens'>('split');
  const [copied, setCopied] = useState(false);

  // Estado de la Lupa (Magnifier)
  const [lensPos, setLensPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === 'split') handleMove(e.clientX);

    if (viewMode === 'lens' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLensPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (viewMode === 'split') handleMove(e.touches[0].clientX);
  };

  // Copiar imagen resultante al portapapeles
  const handleCopyImage = async () => {
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('No se pudo copiar al portapapeles:', err);
    }
  };

  // Descarga en formato específico (PNG / WebP)
  const handleDownload = async (format: 'png' | 'webp') => {
    if (format === 'png') {
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = fileName.replace(/\.[^/.]+$/, '') + '.png';
      a.click();
      return;
    }

    // Convertir a WebP
    const img = new Image();
    img.src = resultUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName.replace(/\.[^/.]+$/, '') + '.webp';
        a.click();
      }, 'image/webp', 0.92);
    };
  };

  // Cálculo de megapíxeles
  const origMp = originalDimensions
    ? ((originalDimensions.width * originalDimensions.height) / 1_000_000).toFixed(2)
    : null;
  const resultMp = resultDimensions
    ? ((resultDimensions.width * resultDimensions.height) / 1_000_000).toFixed(2)
    : null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Header Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1124] p-4 rounded-2xl border border-white/[0.08] shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escalado {scaleFactor}x Real-ESRGAN</span>
          </div>

          {originalDimensions && resultDimensions && (
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-white/[0.03] px-3 py-1 rounded-lg border border-white/[0.05]">
              <span>{originalDimensions.width}×{originalDimensions.height} ({origMp} MP)</span>
              <ArrowRight className="w-3 h-3 text-blue-400" />
              <span className="text-emerald-400 font-bold">
                {resultDimensions.width}×{resultDimensions.height} ({resultMp} MP)
              </span>
            </div>
          )}

          {inferenceTimeMs && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{(inferenceTimeMs / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center bg-[#131833] p-0.5 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setViewMode('split')}
              title="Modo Split Slider"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('lens')}
              title="Modo Lupa de Inspección"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'lens' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('side')}
              title="Modo Lado a Lado"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'side' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyImage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-white/[0.06]"
            title="Copiar imagen al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-white/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva</span>
          </button>

          {/* Download Dropdown */}
          <div className="flex items-center rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition text-white">
            <button
              onClick={() => handleDownload('png')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-r border-blue-400/30 hover:bg-blue-700/40 rounded-l-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG (HD)</span>
            </button>
            <button
              onClick={() => handleDownload('webp')}
              className="px-2.5 py-2 text-[11px] font-semibold hover:bg-blue-700/40 rounded-r-xl transition"
              title="Descargar en formato WebP comprimido"
            >
              WebP
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      {viewMode === 'split' && (
        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[640px] rounded-3xl overflow-hidden border border-white/[0.08] select-none cursor-ew-resize bg-[#05070c] shadow-2xl"
        >
          {/* Layer 1: Upscaled image */}
          <img
            src={resultUrl}
            alt="Escalada con IA"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Layer 2: Original image (clipped by slider) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="relative w-full h-full"
              style={{
                width: containerRef.current?.clientWidth ?? '100%',
                height: '100%',
              }}
            >
              <img
                src={originalUrl}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
            </div>
          </div>

          {/* Divider bar */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl flex items-center justify-center pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-9 h-9 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-blue-600 text-xs font-bold hover:scale-110 transition">
              ↔
            </div>
          </div>

          {/* Floating Tags */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-xs font-semibold text-slate-200 border border-white/10 pointer-events-none shadow-lg">
            Original
          </div>
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-blue-600/85 backdrop-blur-md text-xs font-semibold text-white border border-blue-400/30 pointer-events-none shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escalado {scaleFactor}x</span>
          </div>
        </div>
      )}

      {/* Mode Lens / Magnifier */}
      {viewMode === 'lens' && (
        <div
          ref={containerRef}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setLensPos(null)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[640px] rounded-3xl overflow-hidden border border-white/[0.08] select-none cursor-crosshair bg-[#05070c] shadow-2xl"
        >
          <img
            src={resultUrl}
            alt="Escalada con IA"
            className="w-full h-full object-contain pointer-events-none"
          />

          {lensPos && containerRef.current && (
            <div
              className="absolute w-48 h-48 rounded-full border-2 border-blue-400 pointer-events-none overflow-hidden shadow-2xl bg-black"
              style={{
                left: lensPos.x - 96,
                top: lensPos.y - 96,
                backgroundImage: `url(${resultUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${containerRef.current.clientWidth * 2.5}px ${containerRef.current.clientHeight * 2.5}px`,
                backgroundPosition: `-${lensPos.x * 2.5 - 96}px -${lensPos.y * 2.5 - 96}px`,
              }}
            >
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] text-blue-300 font-mono">
                Zoom 2.5x
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] text-slate-300 pointer-events-none">
            Mueve el cursor sobre la imagen para inspeccionar los detalles de textura
          </div>
        </div>
      )}

      {/* Mode Side-by-Side */}
      {viewMode === 'side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/[0.08] bg-[#05070c] p-2 flex flex-col">
            <span className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-black/80 text-xs font-semibold text-slate-300 border border-white/10">
              Original
            </span>
            <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
          </div>

          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-blue-500/30 bg-[#05070c] p-2 flex flex-col shadow-lg shadow-blue-500/10">
            <span className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-lg bg-blue-600/90 text-xs font-semibold text-white border border-blue-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Real-ESRGAN {scaleFactor}x</span>
            </span>
            <img src={resultUrl} alt="Escalada con IA" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
