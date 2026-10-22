import React, { useEffect, useState } from 'react';
import { Sparkles, Cpu, CheckCircle2, AlertTriangle, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'image' | 'video';
  setActiveTab: (tab: 'image' | 'video') => void;
}

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

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
    <header className="border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-50 group-hover:opacity-80 transition duration-300"></div>
            <div className="relative h-10 w-10 rounded-xl bg-[#0e1326] border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              FreeUpscaler
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
                Client AI
              </span>
            </span>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Super-resolución neuronal en tu navegador • 100% Privado
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-[#0d1124] p-1 rounded-xl border border-white/[0.06] shadow-inner">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imágenes</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === 'video'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>Videos</span>
          </button>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Hardware status badge */}
          {hasWebGPU === null ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Cpu className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              <span className="hidden md:inline">Verificando GPU...</span>
            </div>
          ) : hasWebGPU ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 shadow-sm shadow-emerald-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium hidden md:inline">WebGPU Acelerado</span>
              <span className="font-medium md:hidden">GPU</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium hidden md:inline">Modo WASM (CPU)</span>
              <span className="font-medium md:hidden">WASM</span>
            </div>
          )}

          {/* GitHub link */}
          <a
            href="https://github.com/Kikisafeia/freeupscaler-clone"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#0e1326] border border-white/[0.06] hover:border-white/20 transition"
            title="Ver código fuente en GitHub"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
