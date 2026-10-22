# FreeUpscaler Clone (AI In-Browser Image & Video Upscaler)

[![Production](https://img.shields.io/badge/Vercel-Live%20Demo-black?logo=vercel)](https://freeupscaler-clone.vercel.app)
[![WebGPU](https://img.shields.io/badge/Acceleration-WebGPU-blue?logo=webassembly)](https://freeupscaler-clone.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

Replicación autónoma de alta fidelidad y nivel SaaS profesional de [freeupscaler.app](https://freeupscaler.app/), construida mediante ingeniería inversa de su arquitectura web client-side con **WebGPU**, **ONNX Runtime Web**, **WebSR (Anime4K)** y **WebCodecs (Mediabunny)**.

🌐 **Demo en Producción**: [https://freeupscaler-clone.vercel.app](https://freeupscaler-clone.vercel.app)

---

## ⚡ Características Principales

- **100% Client-Side & Privado**: Las imágenes y videos se procesan directamente en la GPU/CPU del usuario a través de Web Workers. Ningún archivo o byte se envía a servidores externos.
- **AI Image Upscaler**:
  - Modelo: **Real-ESRGAN General x4 v3** (formato ONNX con pesos externos `.data`, ~4.8 MB).
  - Runtime: `onnxruntime-web` con aceleración prioritaria **WebGPU** y degradación automática a **WASM**.
  - Pipeline de Inferencia: Segmentación en teselas (*tiles*) de 128×128 píxeles con 16 px de solapamiento (*overlap*) y máscara de desvanecimiento trapezoidal (*blending*) para evitar costuras visibles en imágenes de cualquier resolución.
  - Modos de escala: **2x** (reescalado bicúbico HQ desde 4x) y **4x** nativo.
- **AI Video Upscaler**:
  - Modelo: Red convolucional **Anime4K (`cnn-2x-m`)** ejecutada mediante shaders WebGPU con `@websr/websr`.
  - Transcodificación por hardware: `mediabunny` sobre **WebCodecs** (`VideoDecoder`, `VideoEncoder`, `CanvasSource`).
  - Sincronización de Audio: Copia intacta de flujos AAC/Opus originales mediante `EncodedAudioPacketSource` y `EncodedPacketSink`.
  - Modo compatibilidad: Degradación automática a canvas 2D si el hardware no dispone de WebGPU.
- **UI & UX de Nivel SaaS Profesional**:
  - **Galería de Muestras Rápidas**: Prueba en 1 clic con 4 presets de prueba (Retrato, Mascota, Producto, Objeto).
  - **Soporte de Portapapeles**: Pega directamente cualquier captura con `Cmd+V` / `Ctrl+V`.
  - **Visor Comparativo Multi-Modo**:
    - *Split-View*: Slider interactivo antes/después con posición porcentual.
    - *Modo Lupa (Magnifier)*: Lente de aumento 2.5x para inspección de microtexturas.
    - *Lado a Lado*: Vista paralela simultánea.
  - **Métricas en Tiempo Real**: Cálculo de resolución y megapíxeles (`0.26 MP` ➔ `4.19 MP`) y latencia de inferencia en segundos.
  - **Opciones de Exportación**: Descarga en PNG (HD sin compresión), WebP optimizado o Copiar al portapapeles.
  - **Sección de FAQ interactiva**: Respuestas técnicas sobre WebGPU, seguridad y aislamiento de memoria.

---

## 📁 Estructura del Proyecto

```
freeupscaler-clone/
├── public/
│   ├── models/
│   │   ├── real_esrgan_general_x4v3.onnx   # Grafo ONNX del modelo
│   │   └── real_esrgan_general_x4v3.data   # Pesos cuantizados (~4.6 MB)
│   └── samples/                            # Muestras para testing rápido en 1 clic
│       ├── sample-person.jpg
│       ├── sample-pet.jpg
│       ├── sample-product.jpg
│       └── sample-object.jpg
├── src/
│   ├── components/
│   │   ├── ComparisonSlider.tsx           # Slider interactivo (Split, Lupa, Side-by-Side)
│   │   ├── Dropzone.tsx                   # Zona de arrastre, paste clipboard y samples
│   │   ├── FaqSection.tsx                 # Preguntas frecuentes técnicas interactivas
│   │   ├── ImageUpscaler.tsx              # Flujo principal de imágenes y métricas
│   │   ├── Navbar.tsx                     # Barra superior con detector WebGPU
│   │   ├── ProgressBar.tsx                # Indicador de progreso de inferencia y etapas
│   │   └── VideoUpscaler.tsx              # Flujo principal de videos
│   ├── types/
│   │   └── worker.ts                      # Interfaces y tipos compartidos
│   ├── workers/
│   │   ├── image.worker.ts                # Web Worker para Comlink (Imágenes)
│   │   ├── real-esrgan.ts                 # Algoritmo de tiling y sesión ONNX WebGPU
│   │   └── video.worker.ts                # Web Worker WebSR + WebCodecs (Videos)
│   ├── App.tsx                            # Contenedor y vistas
│   ├── index.css                          # Estilos Tailwind CSS y patrones visuales
│   └── main.tsx                           # Punto de entrada React
├── package.json
├── tsconfig.json
├── vercel.json                            # Configuración de headers COOP/COEP y cache
└── vite.config.ts
```

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+ (probado en v20.20+)
- Navegador con soporte para WebGPU (Chrome 113+, Edge 113+, Arc, o navegadores basados en Chromium reciente con aceleración gráfica habilitada).

### 1. Clonar / Navegar al directorio
```bash
git clone https://github.com/Kikisafeia/freeupscaler-clone.git
cd freeupscaler-clone
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre en tu navegador `http://localhost:5173`.

### 4. Compilar para producción
```bash
npm run build
```

---

## 🔬 Detalles de la Ingeniería Inversa

| Componente | Implementación Replicada |
| :--- | :--- |
| **Framework** | Vite + React 18 + TypeScript + Tailwind CSS |
| **Aislamiento** | Web Workers nativos comunicados vía proxies RPC con `comlink` |
| **Inferencia de Imágenes** | `onnxruntime-web@1.24.3` con soporte dual WebGPU/WASM |
| **Algoritmo de Teselas** | Ventana de 128 px, paso de 112 px, rampa trapezoidal de 64 px |
| **Inferencia de Videos** | Shaders WebGPU de Anime4K vía `@websr/websr` |
| **Muxer/Demuxer Video** | WebCodecs de bajo nivel con `mediabunny` y retención de audio |
