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
  Package,
  Layers,
  FolderTree
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
  categoriaId: string | null;
  categoria: { id: string, nombre: string, grupo: { id: string, nombre: string } } | null;
  activo: boolean;
  imagen: string | null;
  variantes: Variante[];
}

interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  categorias?: Categoria[];
}

interface Categoria {
  id: string;
  nombre: string;
  grupoId: string;
  descripcion: string | null;
  grupo?: Grupo;
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
    const popoverWidth = 270;
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
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/95 p-1.5 shadow-2xl backdrop-blur-md border-black/10">
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

  const [activeTab, setActiveTab] = useState<'productos' | 'grupos' | 'categorias'>('productos');

  // DATA
  const [productos, setProductos] = useState<Producto[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtros de Búsqueda
  const [filterGrupoId, setFilterGrupoId] = useState('');
  const [filterCategoriaId, setFilterCategoriaId] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Persistencia de filtros
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGrupo = localStorage.getItem('pos_stock_filterGrupoId');
      const savedCategoria = localStorage.getItem('pos_stock_filterCategoriaId');
      const savedSort = localStorage.getItem('pos_stock_sortOrder');
      if (savedGrupo) setFilterGrupoId(savedGrupo);
      if (savedCategoria) setFilterCategoriaId(savedCategoria);
      if (savedSort) setSortOrder(savedSort);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_stock_filterGrupoId', filterGrupoId);
    localStorage.setItem('pos_stock_filterCategoriaId', filterCategoriaId);
    localStorage.setItem('pos_stock_sortOrder', sortOrder);
  }, [filterGrupoId, filterCategoriaId, sortOrder]);
  
  // Modales Producto
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Formulario de Producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [formGrupoId, setFormGrupoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [activo, setActivo] = useState(true);
  const [imagen, setImagen] = useState<string | null>(null);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formularios de Grupo y Categoria (Inline)
  const [newGrupoNombre, setNewGrupoNombre] = useState('');
  const [newCatNombre, setNewCatNombre] = useState('');
  const [newCatGrupoId, setNewCatGrupoId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/productos?q=${encodeURIComponent(search)}`;
      if (filterCategoriaId) url += `&categoriaId=${filterCategoriaId}`;
      
      const [resProd, resGrup, resCat] = await Promise.all([
        fetch(url),
        fetch(`/api/productos/grupos`),
        fetch(`/api/productos/categorias`)
      ]);
      
      if (resProd.ok) {
        let data = await resProd.json();
        if (filterGrupoId && !filterCategoriaId) {
          data = data.filter((p: Producto) => p.categoria?.grupo?.id === filterGrupoId);
        }
        setProductos(data);
      }
      if (resGrup.ok) setGrupos(await resGrup.json());
      if (resCat.ok) setCategorias(await resCat.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterCategoriaId, filterGrupoId]);

  // Grupos y Categorias Actions
  const handleCrearGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrupoNombre) return;
    const res = await fetch('/api/productos/grupos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newGrupoNombre })
    });
    if (res.ok) {
      setNewGrupoNombre('');
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNombre || !newCatGrupoId) return;
    const res = await fetch('/api/productos/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newCatNombre, grupoId: newCatGrupoId })
    });
    if (res.ok) {
      setNewCatNombre('');
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  // Producto Actions
  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setSelectedProducto(null);
    setNombre('');
    setDescripcion('');
    setFormGrupoId('');
    setCategoriaId('');
    setActivo(true);
    setImagen(null);
    setVariantes([{ nombre: 'Única', precio: 0, precioUsd: 0, stock: 0, sku: '' }]);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || '');
    setFormGrupoId(producto.categoria?.grupo?.id || '');
    setCategoriaId(producto.categoriaId || '');
    setActivo(producto.activo);
    setImagen(producto.imagen || null);
    setVariantes(producto.variantes.map(v => ({ ...v, sku: v.sku || '', precioUsd: (v as any).precioUsd || 0 })));
    setFormError(null);
    setShowFormModal(true);
  };

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
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
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
    if (field === 'precio') updated[index].precio = parseFloat(val) || 0;
    else if (field === 'precioUsd') updated[index].precioUsd = parseFloat(val) || 0;
    else if (field === 'stock') updated[index].stock = parseInt(val) || 0;
    else updated[index][field] = val;
    setVariantes(updated);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('¿Estás seguro de que querés eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el producto.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!nombre.trim()) return setFormError('El nombre del producto es obligatorio.');
    for (const v of variantes) {
      if (!v.nombre.trim()) return setFormError('Todas las variantes deben tener un nombre.');
      if (v.precio < 0) return setFormError('El precio (Gs.) de las variantes no puede ser menor a 0.');
      if (v.precioUsd < 0) return setFormError('El precio (USD) de las variantes no puede ser menor a 0.');
      if (v.stock < 0) return setFormError('El stock de las variantes no puede ser menor a 0.');
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nombre,
      descripcion: descripcion || null,
      categoriaId: categoriaId || null,
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

      if (res.ok) {
        setShowFormModal(false);
        fetchData();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Error al guardar el producto.');
      }
    } catch (error) {
      setFormError('Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoriasDelGrupo = categorias.filter(c => c.grupoId === formGrupoId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Catálogo</h1>
          <p className="text-zinc-400">Organiza tu inventario en Grupos, Categorías y Productos.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('productos')}
          className={`flex items-center shrink-0 gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'productos' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          <Package className="w-5 h-5" /> Productos
        </button>
        <button 
          onClick={() => setActiveTab('grupos')}
          className={`flex items-center shrink-0 gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'grupos' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          <Layers className="w-5 h-5" /> Grupos
        </button>
        <button 
          onClick={() => setActiveTab('categorias')}
          className={`flex items-center shrink-0 gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'categorias' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          <FolderTree className="w-5 h-5" /> Categorías
        </button>
      </div>

      {activeTab === 'grupos' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-fade-in max-w-3xl">
          <h2 className="text-xl font-bold text-white mb-6">Grupos Generales</h2>
          {isAdmin && (
            <form onSubmit={handleCrearGrupo} className="flex gap-2 mb-8">
              <input 
                type="text" required placeholder="Ej. INDUMENTARIA, ACCESORIOS"
                value={newGrupoNombre} onChange={e => setNewGrupoNombre(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none uppercase focus:border-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                <Plus className="w-4 h-4"/> Nuevo Grupo
              </button>
            </form>
          )}

          <div className="space-y-2">
            {grupos.map(g => (
              <div key={g.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                <span className="font-bold text-white uppercase">{g.nombre}</span>
                <span className="text-xs text-zinc-400">{g.categorias?.length || 0} Categorías asociadas</span>
              </div>
            ))}
            {grupos.length === 0 && <p className="text-zinc-500 italic text-sm">No hay grupos creados.</p>}
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 animate-fade-in max-w-3xl">
          <h2 className="text-xl font-bold text-white mb-6">Categorías de Producto</h2>
          {isAdmin && (
            <form onSubmit={handleCrearCategoria} className="flex gap-2 mb-8">
              <select 
                required
                value={newCatGrupoId} onChange={e => setNewCatGrupoId(e.target.value)}
                className="w-1/3 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none focus:border-blue-500"
              >
                <option value="">-- Seleccionar Grupo --</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
              <input 
                type="text" required placeholder="Ej. REMERAS, VASOS TÉRMICOS"
                value={newCatNombre} onChange={e => setNewCatNombre(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none uppercase focus:border-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                <Plus className="w-4 h-4"/> Nueva Categoría
              </button>
            </form>
          )}

          <div className="space-y-2">
            {categorias.map(c => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-500 uppercase w-32 truncate">{c.grupo?.nombre}</span>
                <span className="font-bold text-white uppercase">{c.nombre}</span>
              </div>
            ))}
            {categorias.length === 0 && <p className="text-zinc-500 italic text-sm">No hay categorías creadas.</p>}
          </div>
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4">
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

            {/* Filtros */}
            <div className="flex gap-2 max-w-2xl flex-wrap">
              <select
                value={filterGrupoId}
                onChange={(e) => {
                  setFilterGrupoId(e.target.value);
                  setFilterCategoriaId(''); // Reset category on group change
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
              >
                <option value="">Todos los Grupos</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>

              <select
                value={filterCategoriaId}
                onChange={(e) => setFilterCategoriaId(e.target.value)}
                disabled={!filterGrupoId && categorias.length > 0 === false}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition disabled:opacity-50"
              >
                <option value="">Todas las Categorías</option>
                {categorias
                  .filter(c => !filterGrupoId || c.grupoId === filterGrupoId)
                  .map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
              >
                <option value="newest">Más Nuevos</option>
                <option value="name-asc">Orden Alfabético</option>
                <option value="price-desc">Precio (Mayor a Menor)</option>
                <option value="stock-asc">Menor Stock</option>
              </select>
            </div>
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
              {[...productos].sort((a, b) => {
                if (sortOrder === 'name-asc') return a.nombre.localeCompare(b.nombre);
                if (sortOrder === 'price-desc') {
                  const maxA = Math.max(...a.variantes.map(v => v.precio), 0);
                  const maxB = Math.max(...b.variantes.map(v => v.precio), 0);
                  return maxB - maxA;
                }
                if (sortOrder === 'stock-asc') {
                  const minA = Math.min(...a.variantes.map(v => v.stock), Infinity);
                  const minB = Math.min(...b.variantes.map(v => v.stock), Infinity);
                  return minA - minB;
                }
                return 0; // 'newest' ya viene ordenado de la API
              }).map((producto) => (
                <div 
                  key={producto.id} 
                  onClick={() => !isAdmin && handleOpenEdit(producto)}
                  className={`glass-card flex flex-col justify-between rounded-2xl p-6 border ${!isAdmin ? 'cursor-pointer hover:border-violet-500/30 hover:bg-white/[0.02] transition' : ''} ${
                  producto.activo ? 'border-white/5' : 'border-red-500/10 opacity-70 bg-red-500/[0.01]'
                }`}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="shrink-0">
                        {producto.imagen ? (
                          <ProductImageWithHoverZoom src={producto.imagen} alt={producto.nombre} />
                        ) : (
                          <div className="h-14 w-14 rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center shadow-md">
                            <span className="text-lg font-bold text-violet-300 select-none">
                              {producto.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 truncate block">
                          {producto.categoria ? `${producto.categoria.grupo.nombre} > ${producto.categoria.nombre}` : 'Sin Categoría'}
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
                          <button onClick={() => handleOpenEdit(producto)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(producto.id)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2 min-h-[2.5rem]">
                      {producto.descripcion || 'Sin descripción.'}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Variantes & Stock</h4>
                      <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                        {producto.variantes.map((variante, idx) => (
                          <div key={variante.id || idx} className="flex items-center justify-between text-sm bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
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
                                variante.stock === 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : variante.stock <= 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
        </div>
      )}

      {/* Modal Formulario Producto */}
      {showFormModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
              <h3 className="text-lg font-bold text-white">
                {selectedProducto ? (isAdmin ? 'Editar Producto' : 'Detalles del Producto') : 'Crear Producto'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
              {formError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              {/* IMAGEN Y NOMBRE */}
              <div className="flex gap-4 items-start">
                <div className="shrink-0">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Foto</label>
                  <div className="relative group">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }} />
                    {imagen ? (
                      <div className="relative">
                        <img src={imagen} alt="Preview" className={`h-20 w-20 rounded-xl object-cover border border-violet-500/40 shadow-lg ${isAdmin ? 'cursor-pointer' : ''}`} onClick={() => isAdmin && fileInputRef.current?.click()} />
                        {isAdmin && (
                          <button type="button" onClick={() => setImagen(null)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center">
                            <X className="h-3 w-3 text-white" />
                          </button>
                        )}
                      </div>
                    ) : isAdmin ? (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-1 hover:border-violet-500/50">
                        <Upload className="h-5 w-5 text-zinc-500" />
                        <span className="text-[9px] text-zinc-600 font-semibold">Subir</span>
                      </button>
                    ) : (
                      <div className="h-20 w-20 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center">
                        <span className="text-[9px] text-zinc-600 font-semibold text-center leading-tight">Sin<br/>Foto</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Nombre del Producto</label>
                  <input
                    type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    disabled={!isAdmin}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* GRUPO Y CATEGORÍA */}
              <div className="grid sm:grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Grupo</label>
                  <select
                    value={formGrupoId}
                    onChange={(e) => {
                      setFormGrupoId(e.target.value);
                      setCategoriaId(''); // Reset category when group changes
                    }}
                    disabled={!isAdmin}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 disabled:opacity-70 disabled:appearance-none"
                  >
                    <option value="">-- Sin Grupo --</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Categoría</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    disabled={!formGrupoId || !isAdmin}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 disabled:opacity-70 disabled:appearance-none"
                  >
                    <option value="">-- Seleccionar Categoría --</option>
                    {categoriasDelGrupo.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {!formGrupoId && <p className="text-[10px] text-zinc-500 mt-1">Selecciona un grupo primero.</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Descripción</label>
                <textarea
                  value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2}
                  disabled={!isAdmin}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 resize-none disabled:opacity-70"
                />
              </div>

              {selectedProducto && (
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <input type="checkbox" id="activo" checked={activo} onChange={(e) => setActivo(e.target.checked)} disabled={!isAdmin} className="h-4 w-4 disabled:opacity-50" />
                  <label htmlFor="activo" className="text-sm font-semibold text-white cursor-pointer select-none">
                    Producto Activo (Vendedores pueden verlo y venderlo)
                  </label>
                </div>
              )}

              {/* VARIANTES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white">Variantes del Producto</h4>
                  {isAdmin && (
                    <button type="button" onClick={handleAddVariant} className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300">
                      <PlusCircle className="h-4 w-4" /> Agregar Variante
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {variantes.map((v, index) => (
                    <div key={index} className="grid gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01] items-end sm:grid-cols-12">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Nombre (Ej: Talle S)</label>
                        <input type="text" required value={v.nombre} onChange={(e) => handleVariantChange(index, 'nombre', e.target.value)} disabled={!isAdmin} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 disabled:opacity-70" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Precio (Gs.)</label>
                        <input type="number" required value={v.precio} onChange={(e) => handleVariantChange(index, 'precio', e.target.value)} disabled={!isAdmin} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 disabled:opacity-70" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Precio (USD)</label>
                        <input type="number" step="0.01" required value={v.precioUsd} onChange={(e) => handleVariantChange(index, 'precioUsd', e.target.value)} disabled={!isAdmin} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 disabled:opacity-70" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Stock</label>
                        <input type="number" required value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} disabled={!isAdmin} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 disabled:opacity-70" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">SKU</label>
                        <input type="text" value={v.sku || ''} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} disabled={!isAdmin} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 disabled:opacity-70" />
                      </div>
                      {isAdmin && (
                        <div className="sm:col-span-1 flex justify-center pb-1">
                          <button type="button" disabled={variantes.length <= 1} onClick={() => handleRemoveVariant(index)} className="text-zinc-500 hover:text-red-400 disabled:opacity-30">
                            <MinusCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 shrink-0">
                <button type="button" onClick={() => setShowFormModal(false)} className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition">
                  {isAdmin ? 'Cancelar' : 'Cerrar'}
                </button>
                {isAdmin && (
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-55">
                    {submitting ? 'Guardando...' : 'Guardar Producto'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
