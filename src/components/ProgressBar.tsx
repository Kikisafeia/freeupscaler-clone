import React from 'react';
import { Loader2, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  stageLabel?: string;
  stageName?: string;
  elapsedSeconds?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  stageLabel,
  stageName,
  elapsedSeconds,
}) => {
  const getStageIcon = () => {
    if (progress >= 100) return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (stageName === 'loading') return <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />;
    if (stageName === 'upscalingImage' || stageName === 'upscalingFrames')
      return <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />;
    return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  };

  return (
    <div className="w-full bg-[#0d1124] p-6 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col gap-3.5 relative overflow-hidden">
      {/* Background glow bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60"></div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2.5">
          {getStageIcon()}
          <span className="font-semibold text-slate-100 tracking-tight">
            {stageLabel || 'Procesando tensores neuronales...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {elapsedSeconds !== undefined && elapsedSeconds > 0 && (
            <span className="text-[11px] font-mono text-slate-400">
              {elapsedSeconds.toFixed(1)}s
            </span>
          )}
          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-white/[0.06] shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/50"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>Inferencia Web Worker Aislada</span>
        <span className="text-slate-500">
          {stageName === 'loading'
            ? 'Cargando modelo neuronal (~4.8MB en caché)'
            : stageName === 'upscalingImage' || stageName === 'upscalingFrames'
            ? 'Ejecutando teselas en GPU'
            : stageName === 'finalizing'
            ? 'Ensamblando tensores y suavizado'
            : 'Listo'}
        </span>
      </div>
    </div>
  );
};
