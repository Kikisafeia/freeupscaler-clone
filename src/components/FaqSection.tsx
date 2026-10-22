import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Cpu, Zap, Lock } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    question: '¿Mis fotos o videos se suben a algún servidor en la nube?',
    answer:
      'No, en absoluto. A diferencia de las herramientas comerciales tradicionales, todo el cómputo de la red neuronal se ejecuta 100% de manera local dentro de tu navegador web mediante Web Workers y WebGPU. Ningún byte, imagen o video sale de la memoria de tu equipo.',
    icon: <Lock className="w-4 h-4 text-emerald-400" />,
  },
  {
    question: '¿Cómo funciona la aceleración por hardware con WebGPU?',
    answer:
      'WebGPU es el nuevo estándar web moderno de bajo nivel que permite a JavaScript acceder directamente a los núcleos de cómputo de tu tarjeta gráfica (Apple Silicon, NVIDIA, AMD o Intel). El modelo de IA compila sus grafos de tensores directamente en shaders WGSL para una inferencia ultra rápida sin costo de servidor.',
    icon: <Cpu className="w-4 h-4 text-blue-400" />,
  },
  {
    question: '¿Qué modelos de Inteligencia Artificial se utilizan?',
    answer:
      'Para imágenes utilizamos Real-ESRGAN General x4 v3 (un modelo de super-resolución de vanguardia optimizado en ONNX de solo ~4.8 MB con segmentación de teselas de 128px y fusión trapezoidal). Para videos utilizamos Anime4K (red convolucional CNN-2X) orquestada mediante WebCodecs para mantener el audio original y decodificar/codificar fotogramas por hardware.',
    icon: <Zap className="w-4 h-4 text-indigo-400" />,
  },
  {
    question: '¿Por qué es completamente gratuito y sin marcas de agua?',
    answer:
      'Como la inferencia ocurre en tu propio dispositivo (client-side compute), no existen costos de servidores en la nube ni GPU clusters remotos. Esto permite ofrecer una herramienta sin muros de pago, sin suscripciones obligatorias y sin marcas de agua de por vida.',
    icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full max-w-4xl mt-16 pt-12 border-t border-white/[0.08] flex flex-col items-center">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Preguntas Frecuentes</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-2 tracking-tight">
        Todo sobre la Super-Resolución Local
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm text-center max-w-lg mb-8">
        Respuestas técnicas transparentes sobre la arquitectura, seguridad y rendimiento.
      </p>

      <div className="w-full flex flex-col gap-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl transition-all duration-200 border ${
                isOpen
                  ? 'bg-[#0f142b] border-blue-500/30 shadow-lg shadow-blue-500/5'
                  : 'bg-[#0b0e1f]/60 hover:bg-[#0e1227] border-white/[0.06]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    {faq.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-100">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04]">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
