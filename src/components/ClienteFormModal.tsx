'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, ZoomIn } from 'lucide-react';

export interface ClienteData {
  id?: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  imagen?: string | null;
}

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cliente: any) => void;
  clienteToEdit?: ClienteData | null;
  isAdmin: boolean;
}

export default function ClienteFormModal({
  isOpen,
  onClose,
  onSuccess,
  clienteToEdit,
  isAdmin,
}: ClienteFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (clienteToEdit) {
        setNombre(clienteToEdit.nombre || '');
        setTelefono(clienteToEdit.telefono || '');
        setEmail(clienteToEdit.email || '');
        setNotas(clienteToEdit.notas || '');
        setImagen(clienteToEdit.imagen || null);
      } else {
        setNombre('');
        setTelefono('');
        setEmail('');
        setNotas('');
        setImagen(null);
      }
      setFormError(null);
    }
  }, [isOpen, clienteToEdit]);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 1024;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const base64 = canvas.toDataURL('image/webp', 0.85);
        setImagen(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      notas: notas.trim() || null,
      imagen: imagen || null,
    };

    try {
      const isEditing = Boolean(clienteToEdit?.id);
      const url = isEditing ? `/api/clientes/${clienteToEdit!.id}` : '/api/clientes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess(data);
        onClose();
      } else {
        setFormError(data.error || 'Error al guardar el cliente.');
      }
    } catch (error) {
      console.error(error);
      setFormError('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">
              {clienteToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {formError}
              </div>
            )}

            {/* Foto + Nombre */}
            <div className="flex gap-4 items-start">
              <div className="shrink-0">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Foto</label>
                <div className="relative group">
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }} 
                  />
                  
                  {imagen ? (
                    <div className="relative">
                      <img 
                        src={imagen} 
                        alt="Preview" 
                        className="h-20 w-20 rounded-xl object-cover border border-violet-500/40 shadow-lg cursor-pointer hover:opacity-80 transition" 
                        onClick={() => setZoomImage(imagen)} 
                      />
                      {/* Quitar foto: Solo Admin puede quitar la foto existente */}
                      {isAdmin && (
                        <button 
                          type="button" 
                          onClick={() => setImagen(null)} 
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center text-white shadow hover:bg-rose-500 transition"
                          title="Quitar foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Botón para cambiar foto (disponible para todos) */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 w-full text-[10px] text-violet-400 hover:text-violet-300 underline text-center block"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="h-20 w-20 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-1 hover:border-violet-500/50 transition group"
                    >
                      <Upload className="h-4 w-4 text-zinc-500 group-hover:text-violet-400 transition" />
                      <span className="text-[9px] text-zinc-500 font-semibold group-hover:text-zinc-300">Subir</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Nombre Completo <span className="text-violet-400">*</span>
                </label>
                <input
                  type="text" 
                  required 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Laura Benítez"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Teléfono
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="0973997773"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
              />
            </div>

            {/* Notas / Observaciones */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Notas / Observaciones
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Detalles sobre compras, preferencias, mayorista, etc..."
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08] resize-none"
              />
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-55 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox para ampliar imagen en el modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <img 
            src={zoomImage} 
            alt="Zoomed" 
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10"
          />
          <button 
            type="button"
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={() => setZoomImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
