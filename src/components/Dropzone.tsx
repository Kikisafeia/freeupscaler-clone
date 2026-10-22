import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, Film, AlertCircle } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const file = files[0];

    // Validación de tipo
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

  return (
    <div className="w-full">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`group relative flex flex-col items-center justify-center p-10 sm:p-14 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          disabled
            ? 'opacity-50 pointer-events-none border-slate-800 bg-slate-900/30'
            : isDragOver
            ? 'border-blue-500 bg-blue-500/10 shadow-2xl shadow-blue-500/20'
            : 'border-slate-800 hover:border-slate-700 bg-[#0e1222]/80 hover:bg-[#12172b]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-blue-600/20 transition-all duration-300">
          {type === 'image' ? (
            <FileImage className="w-8 h-8 text-blue-400" />
          ) : (
            <Film className="w-8 h-8 text-blue-400" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-white text-center mb-1 flex items-center gap-2">
          <span>Arrastra tu {type === 'image' ? 'imagen' : 'video'} aquí</span>
          <UploadCloud className="w-4 h-4 text-blue-400 inline" />
        </h3>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          o haz clic para seleccionar desde tu equipo. El procesamiento ocurre de forma local sin subir tus archivos.
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">
            {type === 'image' ? 'PNG, JPG, WEBP' : 'MP4, WEBM, MOV'}
          </span>
          <span>•</span>
          <span>Hasta {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB</span>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
