'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageChange: (base64: string) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ImageUploader({ 
  currentImage, 
  onImageChange, 
  label = "Foto",
  size = 'md' 
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Recorte 1:1 centrado
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        // Redimensionar máximo a 1024x1024
        const targetSize = Math.min(size, 1024);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            size,
            size, // Source
            0,
            0,
            targetSize,
            targetSize // Destination
          );

          // Exportar a WebP, 85% de calidad
          const base64 = canvas.toDataURL('image/webp', 0.85);
          onImageChange(base64);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const clearImage = () => {
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const dimensionClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }[size];

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
      )}
      
      <div 
        className={`relative group ${dimensionClasses} shrink-0`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {currentImage ? (
          <div className="relative w-full h-full rounded-full border border-white/10 overflow-hidden shadow-lg group-hover:border-violet-500/50 transition-colors">
            <img 
              src={currentImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-white hover:text-violet-300 text-xs font-semibold px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={clearImage}
                className="text-white hover:text-red-400 text-xs font-semibold px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm"
              >
                Borrar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-full rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors
              ${isDragging 
                ? 'border-violet-500 bg-violet-500/10 text-violet-400' 
                : 'border-white/10 bg-white/[0.02] text-zinc-500 hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-violet-400'
              }`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-center leading-tight opacity-70">
              Subir<br/>Foto
            </span>
          </button>
        )}
      </div>
      
      {!currentImage && (
        <span className="text-[10px] text-zinc-500 text-center max-w-[150px]">
          Recomendado: 1:1 (Cuadrado). Se ajustará a WebP aut.
        </span>
      )}
    </div>
  );
}
