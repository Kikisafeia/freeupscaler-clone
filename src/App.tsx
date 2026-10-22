import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUpscaler } from './components/ImageUpscaler';
import { VideoUpscaler } from './components/VideoUpscaler';
import { FaqSection } from './components/FaqSection';
import { ShieldCheck, Cpu, Sparkles, Zap, Lock, EyeOff, Layers } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative bg-grid-pattern">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 radial-glow pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 radial-glow-bottom pointer-events-none" />

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col items-center relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/[0.08] border border-blue-500/20 text-blue-400 text-xs font-semibold mb-5 shadow-sm shadow-blue-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor Neuronal de Super-Resolución en Navegador</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            Escala tus {activeTab === 'image' ? 'Imágenes' : 'Videos'} con IA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300">
              Directo en tu GPU
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {activeTab === 'image'
              ? 'Multiplica la resolución 2x o 4x con Real-ESRGAN v3. Procesamiento local mediante WebGPU y ONNX Runtime. Sin límites, sin marcas de agua y 100% privado.'
              : 'Escala videos hasta 4x con Anime4K y aceleración de hardware WebCodecs. Tu contenido multimedia jamás abandona tu dispositivo.'}
          </p>

          {/* Quick trust metrics */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-blue-400" />
              <span>Cero subidas a servidores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Privado en memoria</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sin marcas de agua</span>
            </div>
          </div>
        </div>

        {/* Core Tool */}
        <div className="w-full flex justify-center mb-16">
          {activeTab === 'image' ? <ImageUpscaler /> : <VideoUpscaler />}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl border-t border-white/[0.08] pt-14">
          <div className="p-6 rounded-3xl bg-[#0c1022]/80 border border-white/[0.06] hover:border-blue-500/30 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Aceleración WebGPU</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ejecuta tensores de redes neuronales directamente sobre el silicio de tu tarjeta gráfica para máxima velocidad sin costo de servidor.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c1022]/80 border border-white/[0.06] hover:border-emerald-500/30 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Privacidad Absoluta</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus fotos y videos se procesan dentro de la memoria de tu navegador en Web Workers aislados. Ningún byte se transfiere por la red.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c1022]/80 border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Teselas Inteligentes (Tiling)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Segmentación en teselas de 128px con solapamiento y fusión trapezoidal suave. Permite escalar imágenes gigantes sin saturar la VRAM.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#05070c] py-8 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-center sm:text-left">
            FreeUpscaler Clone • Construido con <span className="text-white font-medium">Real-ESRGAN v3</span>, <span className="text-white font-medium">ONNX Runtime</span> y <span className="text-white font-medium">WebGPU</span>.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Kikisafeia/freeupscaler-clone"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              <span>GitHub</span>
            </a>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Inferencia en el Cliente</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
