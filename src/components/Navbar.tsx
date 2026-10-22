import React, { useEffect, useState } from 'react';
import { Sparkles, Cpu, CheckCircle2, AlertTriangle, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'image' | 'video';
  setActiveTab: (tab: 'image' | 'video') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkWebGPU() {
      try {
        const nav = navigator as any;
        if ('gpu' in nav && nav.gpu) {
          const adapter = await nav.gpu.requestAdapter();
          setHasWebGPU(!!adapter);
        } else {
          setHasWebGPU(false);
        }
      } catch {
        setHasWebGPU(false);
      }
    }
    checkWebGPU();
  }, []);

  return (
    <header className="border-b border-white/10 bg-[#0c0f1d]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              FreeUpscaler <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">Local AI</span>
            </span>
            <p className="text-xs text-slate-400 hidden sm:block">100% en tu navegador • Sin límites • Privado</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imágenes</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'video'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>Videos</span>
          </button>
        </div>

        {/* Hardware status badge */}
        <div className="flex items-center gap-2">
          {hasWebGPU === null ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>Verificando GPU...</span>
            </div>
          ) : hasWebGPU ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">WebGPU Activo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium">Modo CPU / WASM</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
