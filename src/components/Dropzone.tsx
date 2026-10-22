import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileImage, Film, AlertCircle, Clipboard, Sparkles } from 'lucide-react';

interface SampleItem {
  id: string;
  name: string;
  label: string;
  path: string;
}

const SAMPLES: SampleItem[] = [
  { id: 'person', name: 'sample-person.jpg', label: 'Retrato', path: '/samples/sample-person.jpg' },
  { id: 'pet', name: 'sample-pet.jpg', label: 'Mascota', path: '/samples/sample-pet.jpg' },
  { id: 'product', name: 'sample-product.jpg', label: 'Producto', path: '/samples/sample-product.jpg' },
  { id: 'object', name: 'sample-object.jpg', label: 'Objeto', path: '/samples/sample-object.jpg' },
];

interface DropzoneProps {
  accept: string[];
  maxSizeBytes: number;
  type: 'image' | 'video';
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  accept,
  maxSizeBytes,
  type,
  onFileSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escuchar evento Paste global (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled || type !== 'image') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFiles([file]);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, type]);

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const file = files[0];

    const isAccepted = accept.some((a) => {
      if (a.endsWith('/*')) {
        const prefix = a.split('/')[0];
        return file.type.startsWith(prefix);
      }
      return file.type === a || file.name.toLowerCase().endsWith(a.replace('.', ''));
    });

    if (!isAccepted) {
      setError(`Formato no soportado (${file.type || file.name}). Aceptados: ${accept.join(', ')}`);
      return;
    }

    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      setError(`El archivo excede el tamaño máximo permitido (${maxMb} MB).`);
      return;
    }

    onFileSelected(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const handleLoadSample = async (sample: SampleItem) => {
    try {
      setLoadingSample(sample.id);
      setError(null);
      const res = await fetch(sample.path);
      if (!res.ok) throw new Error('No se pudo cargar la muestra');
      const blob = await res.blob();
      const file = new File([blob], sample.name, { type: 'image/jpeg' });
      onFileSelected(file);
    } catch (err: any) {
      setError(`Error al cargar muestra: ${err?.message || err}`);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Drop Target Card */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`group relative flex flex-col items-center justify-center p-10 sm:p-14 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
          disabled
            ? 'opacity-50 pointer-events-none border-slate-800 bg-slate-900/30'
            : isDragOver
            ? 'border-blue-500 bg-blue-500/[0.08] shadow-2xl shadow-blue-500/20 scale-[1.01]'
            : 'border-white/[0.12] hover:border-blue-500/50 bg-[#0c1022]/90 hover:bg-[#0f142b] shadow-2xl shadow-black/40'
        }`}
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/15 transition duration-500" />

        <input
          ref={inputRef}
          type="file"
          accept={accept.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="relative h-18 w-18 p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-blue-400/50 transition-all duration-300 shadow-lg shadow-blue-500/10">
          {type === 'image' ? (
            <FileImage className="w-9 h-9 text-blue-400" />
          ) : (
            <Film className="w-9 h-9 text-blue-400" />
          )}
        </div>

        <h3 className="text-xl font-bold text-white text-center mb-2 tracking-tight flex items-center gap-2">
          <span>Arrastra tu {type === 'image' ? 'imagen' : 'video'} aquí</span>
          <UploadCloud className="w-5 h-5 text-blue-400" />
        </h3>
        
        <p className="text-sm text-slate-400 text-center max-w-md leading-relaxed mb-4">
          o haz clic para explorar tus archivos. Tu contenido se procesa de forma 100% privada en la GPU de tu equipo.
        </p>

        {/* Badges / Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium">
            {type === 'image' ? 'PNG, JPG, WEBP' : 'MP4, WEBM, MOV'}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium">
            Hasta {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
          </span>
          {type === 'image' && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 font-medium">
              <Clipboard className="w-3 h-3" />
              <span>Pega con Cmd+V / Ctrl+V</span>
            </span>
          )}
        </div>
      </div>

      {/* 1-Click Samples Section (Only for Images) */}
      {type === 'image' && (
        <div className="w-full flex flex-col items-center gap-2.5 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-slate-300">O prueba con una muestra en 1 clic:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleLoadSample(s)}
                disabled={disabled || loadingSample !== null}
                className="group relative flex items-center gap-2.5 p-2 rounded-xl bg-[#0c1022] hover:bg-[#121833] border border-white/[0.06] hover:border-blue-500/40 transition-all text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10 group-hover:scale-105 transition">
                  <img src={s.path} alt={s.label} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition truncate">
                    {s.label}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {loadingSample === s.id ? 'Cargando...' : 'Probar IA'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs shadow-lg shadow-rose-500/5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
