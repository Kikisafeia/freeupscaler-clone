import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  stageLabel?: string;
  stageName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  stageLabel,
  stageName,
}) => {
  return (
    <div className="w-full bg-[#0e1222] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="font-medium text-slate-200">
            {stageLabel || 'Procesando con Inteligencia Artificial...'}
          </span>
        </div>
        <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
          style={{ width: `${Math.max(3, progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Web Worker + Inferencia WebGPU</span>
        <span>
          {stageName === 'loading'
            ? 'Carga inicial (se almacena en caché local)'
            : stageName === 'upscalingImage' || stageName === 'upscalingFrames'
            ? 'Procesamiento neuronal activo'
            : 'Generando archivo de salida'}
        </span>
      </div>
    </div>
  );
};
