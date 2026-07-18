'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  ImageIcon,
  Upload,
} from 'lucide-react';

interface Variante {
  id?: string;
  nombre: string;
  precio: number;
  precioUsd: number;
  stock: number;
  sku?: string | null;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  activo: boolean;
  imagen: string | null;
  variantes: Variante[];
}

function ProductImageWithHoverZoom({ src, alt }: { src: string; alt: string }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateCoordinates = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let popoverX = x + 15;
    let popoverY = y + 15;
    const popoverWidth = 270; // 256px image + padding/borders
    const popoverHeight = 270;

    if (rect.left + popoverX + popoverWidth > window.innerWidth) {
      popoverX = x - popoverWidth - 15;
    }
    if (rect.top + popoverY + popoverHeight > window.innerHeight) {
      popoverY = y - popoverHeight - 15;
    }

    setCoords({ x: popoverX, y: popoverY });
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    updateCoordinates(e);
    setShow(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseMove={updateCoordinates}
      onMouseLeave={() => setShow(false)}
    >
      <img
        src={src}
        alt={alt}
        className="h-14 w-14 rounded-xl object-cover border border-white/10 shadow-md transition-all duration-200 hover:scale-105 hover:border-violet-500 cursor-zoom-in"
      />
      {show && (
        <div
          style={{
            position: 'absolute',
            left: coords.x,
            top: coords.y,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="animate-fade-in"
        >
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 border-black/10">
            <img
              src={src}
              alt={alt}
              className="w-64 h-64 rounded-xl object-cover max-w-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductosPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMIN';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Formulario de Producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [activo, setActivo] = useState(true);
  const [imagen, setImagen] = useState<string | null>(null);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setProductos(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductos();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setSelectedProducto(null);
    setNombre('');
    setDescripcion('');
    setCategoria('');
    setActivo(true);
    setImagen(null);
    setVariantes([{ nombre: 'Única', precio: 0, precioUsd: 0, stock: 0, sku: '' }]);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (producto: Producto) => {
    if (!isAdmin) return;
    setSelectedProducto(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || '');
    setCategoria(producto.categoria || '');
    setActivo(producto.activo);
    setImagen(producto.imagen || null);
    setVariantes(producto.variantes.map(v => ({ ...v, sku: v.sku || '', precioUsd: (v as any).precioUsd || 0 })));
    setFormError(null);
    setShowFormModal(true);
  };

  // Procesa la imagen seleccionada, la recorta a 1:1 con canvas y la comprime a WebP
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Recorte centrado cuadrado
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        
        // Comprimir en formato WebP a calidad 0.70
        const base64 = canvas.toDataURL('image/webp', 0.70);
        setImagen(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddVariant = () => {
    setVariantes([...variantes, { nombre: '', precio: 0, precioUsd: 0, stock: 0, sku: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variantes.length <= 1) return;
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof Variante, val: any) => {
    const updated = [...variantes];
    if (field === 'precio') {
      updated[index].precio = parseFloat(val) || 0;
    } else if (field === 'precioUsd') {
      updated[index].precioUsd = parseFloat(val) || 0;
    } else if (field === 'stock') {
      updated[index].stock = parseInt(val) || 0;
    } else {
      updated[index][field] = val;
    }
    setVariantes(updated);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('¿Estás seguro de que querés eliminar este producto?')) return;

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        fetchProductos();
      } else {
        alert(data.error || 'Error al eliminar el producto.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!nombre.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }

    // Validar variantes
    for (const v of variantes) {
      if (!v.nombre.trim()) {
        setFormError('Todas las variantes deben tener un nombre (ej: Talle M, Color Negro, etc.).');
        return;
      }
      if (v.precio < 0) {
        setFormError('El precio (Gs.) de las variantes no puede ser menor a 0.');
        return;
      }
      if (v.precioUsd < 0) {
        setFormError('El precio (USD) de las variantes no puede ser menor a 0.');
        return;
      }
      if (v.stock < 0) {
        setFormError('El stock de las variantes no puede ser menor a 0.');
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nombre,
      descripcion: descripcion || null,
      categoria: categoria || null,
      activo,
      imagen: imagen || null,
      variantes,
    };

    try {
      const url = selectedProducto ? `/api/productos/${selectedProducto.id}` : '/api/productos';
      const method = selectedProducto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowFormModal(false);
        fetchProductos();
      } else {
        setFormError(data.error || 'Error al guardar el producto.');
      }
    } catch (error) {
      setFormError('Ocurrió un error inesperado.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Búsqueda y Crear */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:bg-white/[0.06]"
          />
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Lista de Productos */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : productos.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-12 text-center border border-white/5">
          <AlertCircle className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No hay productos registrados</h3>
          <p className="text-zinc-500 text-sm mt-1">Registra productos para comenzar a operar el sistema.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {productos.map((producto) => (
            <div key={producto.id} className={`glass-card flex flex-col justify-between rounded-2xl p-6 border ${
              producto.activo ? 'border-white/5' : 'border-red-500/10 opacity-70 bg-red-500/[0.01]'
            }`}>
              <div>
                <div className="flex items-start justify-between gap-3">
                  {/* Miniatura de imagen */}
                  <div className="shrink-0">
                    {producto.imagen ? (
                      <ProductImageWithHoverZoom
                        src={producto.imagen}
                        alt={producto.nombre}
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-violet-300 select-none">
                          {producto.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                      {producto.categoria || 'Sin Categoría'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                      <span className="truncate">{producto.nombre}</span>
                      {!producto.activo && (
                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/20 shrink-0">
                          Inactivo
                        </span>
                      )}
                    </h3>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(producto)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-400 mt-2 line-clamp-2 min-h-[2.5rem]">
                  {producto.descripcion || 'Sin descripción.'}
                </p>

                {/* Variantes del Producto */}
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Variantes & Stock</h4>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {producto.variantes.map((variante, idx) => (
                      <div
                        key={variante.id || idx}
                        className="flex items-center justify-between text-sm bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2"
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="font-medium text-white truncate">{variante.nombre}</p>
                          {variante.sku && <p className="text-[10px] text-zinc-500">SKU: {variante.sku}</p>}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-semibold text-violet-400">
                            ₲ {Math.round(variante.precio).toLocaleString('es-PY')}
                            {variante.precioUsd > 0 && ` / $ ${variante.precioUsd.toFixed(2)}`}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                            variante.stock === 0
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : variante.stock <= 5
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-white/5'
                          }`}>
                            {variante.stock} disp.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-600 flex justify-between">
                <span>ID: {producto.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Formulario Producto (ADMIN Only) */}
      {showFormModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
              <h3 className="text-lg font-bold text-white">
                {selectedProducto ? 'Editar Producto' : 'Crear Producto'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {formError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              {/* Fila superior: imagen + nombre/categoría */}
              <div className="flex gap-4 items-start">
                {/* Selector de Imagen 1:1 */}
                <div className="shrink-0">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Foto
                  </label>
                  <div className="relative group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file);
                      }}
                    />
                    {imagen ? (
                      <div className="relative">
                        <img
                          src={imagen}
                          alt="Preview"
                          className="h-20 w-20 rounded-xl object-cover border border-violet-500/40 shadow-lg cursor-pointer hover:brightness-90 transition"
                          onClick={() => fileInputRef.current?.click()}
                        />
                        <button
                          type="button"
                          onClick={() => setImagen(null)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center shadow-md hover:bg-rose-500 transition"
                          title="Quitar imagen"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 w-20 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-1 hover:border-violet-500/50 hover:bg-violet-500/[0.04] transition group"
                      >
                        <Upload className="h-5 w-5 text-zinc-500 group-hover:text-violet-400 transition" />
                        <span className="text-[9px] text-zinc-600 group-hover:text-violet-400 transition font-semibold">Subir</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Nombre y Categoría */}
                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Remera Algodón Premium"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      placeholder="Indumentaria, Electrónica..."
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles del producto, materiales, especificaciones..."
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08] resize-none"
                />
              </div>

              {selectedProducto && (
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/[0.04] text-violet-600 focus:ring-violet-500/20"
                  />
                  <label htmlFor="activo" className="text-sm font-semibold text-white cursor-pointer select-none">
                    Producto Activo (Vendedores pueden verlo y venderlo)
                  </label>
                </div>
              )}

              {/* Sección Variantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white">Variantes del Producto</h4>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Agregar Variante
                  </button>
                </div>

                <div className="space-y-3">
                  {variantes.map((v, index) => (
                    <div
                      key={index}
                      className="grid gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01] items-end sm:grid-cols-12"
                    >
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Nombre (Ej: Talle S)
                        </label>
                        <input
                          type="text"
                          required
                          value={v.nombre}
                          onChange={(e) => handleVariantChange(index, 'nombre', e.target.value)}
                          placeholder="M - Azul"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Precio (Gs.)
                        </label>
                        <input
                          type="number"
                          required
                          value={v.precio}
                          onChange={(e) => handleVariantChange(index, 'precio', e.target.value)}
                          placeholder="14000"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Precio (USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={v.precioUsd}
                          onChange={(e) => handleVariantChange(index, 'precioUsd', e.target.value)}
                          placeholder="2.50"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Stock
                        </label>
                        <input
                          type="number"
                          required
                          value={v.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                          placeholder="10"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          SKU (Opcional)
                        </label>
                        <input
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          placeholder="REM-AZ-M"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-center pb-1">
                        <button
                          type="button"
                          disabled={variantes.length <= 1}
                          onClick={() => handleRemoveVariant(index)}
                          className="text-zinc-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-zinc-500 transition"
                          title="Eliminar variante"
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-55"
                >
                  {submitting ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
