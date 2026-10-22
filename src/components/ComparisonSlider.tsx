import React, { useState, useRef, useCallback } from 'react';
import { Download, RotateCcw, Sparkles } from 'lucide-react';

interface ComparisonSliderProps {
  originalUrl: string;
  resultUrl: string;
  originalDimensions?: { width: number; height: number };
  resultDimensions?: { width: number; height: number };
  scaleFactor: number;
  onReset: () => void;
  fileName?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  resultUrl,
  originalDimensions,
  resultDimensions,
  scaleFactor,
  onReset,
  fileName = 'upscaled-image.png',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
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
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top info and action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escalado {scaleFactor}x completado</span>
          </div>
          {originalDimensions && resultDimensions && (
            <span className="text-xs text-slate-400">
              {originalDimensions.width}×{originalDimensions.height} px →{' '}
              <strong className="text-emerald-400 font-semibold">
                {resultDimensions.width}×{resultDimensions.height} px
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Subir otra</span>
          </button>
          <a
            href={resultUrl}
            download={fileName}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PNG</span>
          </a>
        </div>
      </div>

      {/* Comparison interactive slider */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[600px] rounded-2xl overflow-hidden border border-slate-800 select-none cursor-ew-resize bg-[#07090e]"
      >
        {/* Layer 1: Upscaled image (full background) */}
        <img
          src={resultUrl}
          alt="Escalada por IA"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Layer 2: Original image (clipped by slider percentage) */}
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
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-blue-600 text-xs font-bold">
            ↔
          </div>
        </div>

        {/* Floating Tags */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-white/10 pointer-events-none">
          Original
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-blue-600/80 backdrop-blur-md text-[11px] font-medium text-white border border-blue-400/30 pointer-events-none flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Real-ESRGAN {scaleFactor}x</span>
        </div>
      </div>
    </div>
  );
};
