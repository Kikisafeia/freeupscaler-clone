import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUpscaler } from './components/ImageUpscaler';
import { VideoUpscaler } from './components/VideoUpscaler';
import { ShieldCheck, Cpu, Sparkles, Zap, Lock } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor de Super-Resolución Neuronal en Navegador</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Escala tus {activeTab === 'image' ? 'Imágenes' : 'Videos'} con IA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              Directo en tu GPU
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {activeTab === 'image'
              ? 'Mejora resolución 2x o 4x con Real-ESRGAN v3. Procesamiento local mediante WebGPU y ONNX Runtime. Sin límites, sin marcas de agua y 100% privado.'
              : 'Escala videos hasta 4x con Anime4K y aceleración de hardware WebCodecs. Tu contenido multimedia jamás abandona tu dispositivo.'}
          </p>
        </div>

        {/* Core Tool */}
        <div className="w-full flex justify-center mb-16">
          {activeTab === 'image' ? <ImageUpscaler /> : <VideoUpscaler />}
        </div>

        {/* Feature Badges / Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl border-t border-slate-800/80 pt-12">
          <div className="p-5 rounded-2xl bg-[#0e1222]/60 border border-slate-800/80 flex flex-col gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Aceleración WebGPU</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ejecuta tensores de redes neuronales directamente sobre el silicio de tu tarjeta gráfica para máxima velocidad sin costo de servidor.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1222]/60 border border-slate-800/80 flex flex-col gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Privacidad Absoluta</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus fotos y videos se procesan dentro de la memoria de tu navegador en Web Workers aislados. Ningún byte se transfiere por la red.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1222]/60 border border-slate-800/80 flex flex-col gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Sin Restricciones</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sin registros, sin suscripciones mensuales y sin marcas de agua. Diseñado con modelos open source de super-resolución.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#07090e] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Replicación de arquitectura con ingeniería inversa asistida por IA. Real-ESRGAN + WebSR Anime4K.
          </p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Client-Side Neural Inference</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
