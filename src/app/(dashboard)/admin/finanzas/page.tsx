'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, TrendingDown, Plus, Tag, Search, History, ChevronDown, ChevronUp, Calendar, Filter, Trash2 } from 'lucide-react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const gs = (n: number) => `${Math.round(n).toLocaleString('es-PY')} Gs.`;
const usd = (n: number) => `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (n: number, moneda: string) => moneda === 'USD' ? usd(n) : gs(n);

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

// ─── HISTORIAL UNIFICADO ──────────────────────────────────────────────────────
function HistorialTab() {
  const [desde, setDesde] = useState(fechaHoy());
  const [hasta, setHasta] = useState(fechaHoy());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const [gastosRes, comprasRes] = await Promise.all([
        fetch(`/api/gastos?desde=${desde}&hasta=${hasta}`),
        fetch(`/api/compras?desde=${desde}&hasta=${hasta}`),
      ]);
      const gastos = gastosRes.ok ? await gastosRes.json() : [];
      const compras = comprasRes.ok ? await comprasRes.json() : [];

      // Unificar y etiquetar
      const unificado = [
        ...gastos.map((g: any) => ({ ...g, _tipo: 'GASTO', _fecha: g.fecha })),
        ...compras.map((c: any) => ({ ...c, _tipo: 'COMPRA', _fecha: c.fecha })),
      ].sort((a, b) => new Date(b._fecha).getTime() - new Date(a._fecha).getTime());

      setItems(unificado);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => { fetchHistorial(); }, [fetchHistorial]);

  const handleDelete = async (id: string, tipo: 'GASTO' | 'COMPRA') => {
    const confirmMsg = tipo === 'GASTO' 
      ? '¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.' 
      : '¿Estás seguro de eliminar esta compra? Se revertirá el stock sumado.';
    
    if (!window.confirm(confirmMsg)) return;

    const endpoint = tipo === 'GASTO' ? `/api/gastos/${id}` : `/api/compras/${id}`;
    
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchHistorial();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'No se pudo eliminar'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al intentar eliminar.');
    }
  };

  const totalGastosPyg = items.filter(i => i._tipo === 'GASTO' && i.moneda === 'PYG').reduce((a, i) => a + i.monto, 0);
  const totalGastosUsd = items.filter(i => i._tipo === 'GASTO' && i.moneda === 'USD').reduce((a, i) => a + i.monto, 0);
  const totalComprasPyg = items.filter(i => i._tipo === 'COMPRA' && i.moneda === 'PYG').reduce((a, i) => a + i.total, 0);
  const totalComprasUsd = items.filter(i => i._tipo === 'COMPRA' && i.moneda === 'USD').reduce((a, i) => a + i.total, 0);

  return (
    <div className="space-y-5">
      {/* FILTROS */}
      <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtrar por fecha</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <button onClick={fetchHistorial}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors mt-4">
            Buscar
          </button>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel border border-red-500/20 bg-red-500/5 rounded-xl p-4">
          <p className="text-xs text-red-400 font-semibold mb-1">Gastos Gs.</p>
          <p className="text-lg font-bold text-white">{gs(totalGastosPyg)}</p>
        </div>
        <div className="glass-panel border border-red-500/20 bg-red-500/5 rounded-xl p-4">
          <p className="text-xs text-red-400 font-semibold mb-1">Gastos USD</p>
          <p className="text-lg font-bold text-white">{usd(totalGastosUsd)}</p>
        </div>
        <div className="glass-panel border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4">
          <p className="text-xs text-indigo-400 font-semibold mb-1">Compras Gs.</p>
          <p className="text-lg font-bold text-white">{gs(totalComprasPyg)}</p>
        </div>
        <div className="glass-panel border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4">
          <p className="text-xs text-indigo-400 font-semibold mb-1">Compras USD</p>
          <p className="text-lg font-bold text-white">{usd(totalComprasUsd)}</p>
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No hay registros en el período seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => {
            const esGasto = item._tipo === 'GASTO';
            const fecha = new Date(item._fecha);
            const isOpen = expanded === item.id;

            return (
              <div key={item.id} className={`glass-panel rounded-xl border overflow-hidden ${esGasto ? 'border-red-500/20' : 'border-indigo-500/20'}`}>
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  {/* BADGE TIPO */}
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${esGasto ? 'bg-red-500/20 text-red-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {esGasto ? 'GASTO' : 'COMPRA'}
                  </span>

                  {/* INFO PRINCIPAL */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {esGasto ? (item.descripcion || '—') : (item.proveedor ? `Proveedor: ${item.proveedor}` : 'Compra de mercadería')}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {esGasto ? item.categoria?.nombre : `${item.items?.length ?? 0} producto(s)`}
                      {' · '}
                      Por {item.usuario?.name ?? '—'}
                    </p>
                  </div>

                  {/* FECHA */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-zinc-300 text-xs">{fecha.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-zinc-500 text-xs">{fecha.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {/* MONTO */}
                  <div className="shrink-0 text-right">
                    <p className={`font-bold ${esGasto ? 'text-red-400' : 'text-indigo-400'}`}>
                      -{fmt(esGasto ? item.monto : item.total, item.moneda)}
                    </p>
                    <p className="text-zinc-500 text-xs">{item.moneda}</p>
                  </div>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
                </button>

                {/* DETALLE EXPANDIBLE */}
                {isOpen && (
                  <div className="border-t border-white/5 p-4 bg-black/20">
                    {esGasto ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div><p className="text-xs text-zinc-500">Categoría</p><p className="text-white font-medium">{item.categoria?.nombre}</p></div>
                        <div><p className="text-xs text-zinc-500">Monto</p><p className="text-white font-medium">{fmt(item.monto, item.moneda)}</p></div>
                        <div><p className="text-xs text-zinc-500">Registrado por</p><p className="text-white font-medium">{item.usuario?.name ?? '—'}</p></div>
                        <div><p className="text-xs text-zinc-500">Fecha completa</p><p className="text-white font-medium">{fecha.toLocaleString('es-PY')}</p></div>
                        {item.descripcion && (
                          <div className="col-span-2 sm:col-span-4"><p className="text-xs text-zinc-500">Descripción</p><p className="text-zinc-200">{item.descripcion}</p></div>
                        )}
                        <div className="col-span-2 sm:col-span-4 mt-2 flex justify-end">
                          <button onClick={() => handleDelete(item.id, 'GASTO')} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar Gasto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div><p className="text-xs text-zinc-500">Proveedor</p><p className="text-white font-medium">{item.proveedor || '—'}</p></div>
                          <div><p className="text-xs text-zinc-500">Total</p><p className="text-white font-medium">{fmt(item.total, item.moneda)}</p></div>
                          <div><p className="text-xs text-zinc-500">Registrado por</p><p className="text-white font-medium">{item.usuario?.name ?? '—'}</p></div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Productos comprados</p>
                          <div className="space-y-1">
                            {item.items?.map((ci: any) => (
                              <div key={ci.id} className="flex justify-between items-center text-xs bg-black/30 rounded-lg px-3 py-2">
                                <span className="text-zinc-300">
                                  {ci.variante?.producto?.nombre} — {ci.variante?.nombre}
                                </span>
                                <span className="text-zinc-400">
                                  {ci.cantidad} × {fmt(ci.costoUnit, item.moneda)} = {fmt(ci.cantidad * ci.costoUnit, item.moneda)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-white/5">
                          <button onClick={() => handleDelete(item.id, 'COMPRA')} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar Compra (Revierte Stock)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function FinanzasPage() {
  const [activeTab, setActiveTab] = useState<'gastos' | 'compras' | 'historial'>('gastos');

  // Gastos
  const [categorias, setCategorias] = useState<any[]>([]);
  const [newCatNombre, setNewCatNombre] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoDesc, setGastoDesc] = useState('');
  const [gastoCatId, setGastoCatId] = useState('');
  const [gastoMoneda, setGastoMoneda] = useState('PYG');
  const [loadingGastos, setLoadingGastos] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Compras
  const [productSearch, setProductSearch] = useState('');
  const [productsFound, setProductsFound] = useState<any[]>([]);
  const [compraItems, setCompraItems] = useState<any[]>([]);
  const [proveedor, setProveedor] = useState('');
  const [compraMoneda, setCompraMoneda] = useState('PYG');
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [successCompra, setSuccessCompra] = useState('');

  useEffect(() => { fetchCategorias(); }, []);

  const fetchCategorias = async () => {
    const res = await fetch('/api/gastos/categorias');
    if (res.ok) setCategorias(await res.json());
  };

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNombre) return;
    const res = await fetch('/api/gastos/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newCatNombre })
    });
    if (res.ok) { setNewCatNombre(''); fetchCategorias(); }
  };

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGastos(true);
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoriaId: gastoCatId, monto: gastoMonto, descripcion: gastoDesc, moneda: gastoMoneda })
    });
    setLoadingGastos(false);
    if (res.ok) {
      setGastoMonto(''); setGastoDesc('');
      setSuccessMsg('✓ Gasto registrado exitosamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  useEffect(() => {
    if (productSearch.trim().length === 0) { setProductsFound([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(productSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setProductsFound(data.filter((p: any) => p.activo && p.variantes.length > 0));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const handleAddCompraItem = (variante: any, productoNombre: string) => {
    const existing = compraItems.find(i => i.varianteId === variante.id);
    if (existing) {
      setCompraItems(compraItems.map(i => i.varianteId === variante.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCompraItems([...compraItems, { varianteId: variante.id, productoNombre, varianteNombre: variante.nombre, cantidad: 1, costoUnit: 0 }]);
    }
    setProductSearch('');
  };

  const handleRegistrarCompra = async () => {
    if (compraItems.length === 0) return;
    setLoadingCompras(true);
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedor, moneda: compraMoneda, items: compraItems })
    });
    setLoadingCompras(false);
    if (res.ok) {
      setCompraItems([]); setProveedor('');
      setSuccessCompra('✓ Compra registrada. Stock actualizado.');
      setTimeout(() => setSuccessCompra(''), 3000);
    }
  };

  const totalCompra = compraItems.reduce((acc, item) => acc + (item.costoUnit * item.cantidad), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Finanzas y Compras</h1>
        <p className="text-zinc-400">Registra gastos operativos y compras de mercadería.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('gastos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'gastos' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
          <TrendingDown className="w-4 h-4" /> Gastos Operativos
        </button>
        <button onClick={() => setActiveTab('compras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'compras' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
          <ShoppingCart className="w-4 h-4" /> Ingreso de Mercadería
        </button>
        <button onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'historial' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      {/* ── GASTOS ── */}
      {activeTab === 'gastos' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Registrar Nuevo Gasto</h2>
            {successMsg && <p className="text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-sm mb-4">{successMsg}</p>}
            <form onSubmit={handleCrearGasto} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Categoría</label>
                <select required value={gastoCatId} onChange={e => setGastoCatId(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none">
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Monto</label>
                  {gastoMoneda === 'PYG' ? (
                    <input type="text" inputMode="numeric" required value={gastoMonto}
                      onChange={e => { if (/^\d*$/.test(e.target.value)) setGastoMonto(e.target.value); }}
                      placeholder="50000"
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                  ) : (
                    <input type="number" required min="0.01" step="0.01" value={gastoMonto}
                      onChange={e => setGastoMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Moneda</label>
                  <select value={gastoMoneda} onChange={e => setGastoMoneda(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="PYG">Guaraníes (PYG)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descripción / Justificativo</label>
                <input type="text" required value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <button type="submit" disabled={loadingGastos || !gastoCatId}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 mt-2 transition-colors">
                {loadingGastos ? 'Guardando...' : 'Registrar Gasto (Resta en Caja)'}
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 h-fit">
            <h2 className="text-xl font-bold text-white mb-6">Categorías de Gastos</h2>
            <form onSubmit={handleCrearCategoria} className="flex gap-2 mb-6">
              <input type="text" required placeholder="Ej. LUZ, INTERNET, SUELDOS"
                value={newCatNombre} onChange={e => setNewCatNombre(e.target.value.toUpperCase())}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none" />
              <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {categorias.map(c => (
                <span key={c.id} className="bg-white/5 border border-white/10 text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-violet-400" /> {c.nombre}
                </span>
              ))}
              {categorias.length === 0 && <p className="text-sm text-zinc-500 italic">No hay categorías. Crea una arriba.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPRAS ── */}
      {activeTab === 'compras' && (
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Ingresar Mercadería</h2>
              {successCompra && <p className="text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-sm mb-4">{successCompra}</p>}
              <div className="relative mb-4">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input type="text" placeholder="Buscar producto para sumar stock..."
                  value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              {productsFound.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {productsFound.map(p => (
                    <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <p className="font-bold text-white text-sm mb-2">{p.nombre}</p>
                      <div className="space-y-2">
                        {p.variantes.map((v: any) => (
                          <div key={v.id} className="flex items-center justify-between text-xs bg-black/40 p-2 rounded-lg">
                            <span className="text-zinc-300">{v.nombre} (Stock: {v.stock})</span>
                            <button onClick={() => handleAddCompraItem(v, p.nombre)}
                              className="text-indigo-400 hover:text-white hover:bg-indigo-500/20 px-2 py-1 rounded transition">
                              Sumar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <h2 className="text-xl font-bold text-white mb-4">Detalle de Compra a Proveedor</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-bold mb-1">Proveedor (Opcional)</label>
                  <input type="text" value={proveedor} onChange={e => setProveedor(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-bold mb-1">Moneda de Pago</label>
                  <select value={compraMoneda} onChange={e => setCompraMoneda(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none focus:border-indigo-500">
                    <option value="PYG">Guaraníes (PYG)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
              {compraItems.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
                  Selecciona productos a la izquierda para cargar la factura de compra.
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-400 px-2">
                    <div className="col-span-5">Producto / Variante</div>
                    <div className="col-span-3">Costo Unit.</div>
                    <div className="col-span-3">Cantidad</div>
                    <div className="col-span-1"></div>
                  </div>
                  {compraItems.map((item, idx) => (
                    <div key={item.varianteId} className="grid grid-cols-12 gap-2 items-center bg-black/40 p-2 rounded-xl">
                      <div className="col-span-5 text-sm">
                        <p className="font-bold text-white truncate">{item.productoNombre}</p>
                        <p className="text-xs text-zinc-400 truncate">{item.varianteNombre}</p>
                      </div>
                      <div className="col-span-3">
                        <input type="number" value={item.costoUnit}
                          onChange={e => { const n = [...compraItems]; n[idx].costoUnit = Number(e.target.value); setCompraItems(n); }}
                          className="w-full bg-transparent border-b border-white/20 text-white text-sm outline-none px-1" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" value={item.cantidad} min="1"
                          onChange={e => { const n = [...compraItems]; n[idx].cantidad = Number(e.target.value); setCompraItems(n); }}
                          className="w-full bg-transparent border-b border-white/20 text-white text-sm outline-none px-1" />
                      </div>
                      <div className="col-span-1 text-right">
                        <button onClick={() => setCompraItems(compraItems.filter(i => i.varianteId !== item.varianteId))}
                          className="text-red-400 hover:text-red-300 p-1">×</button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-4">
                    <span className="text-zinc-400 font-bold">Total Compra:</span>
                    <span className="text-2xl font-bold text-indigo-400">{fmt(totalCompra, compraMoneda)}</span>
                  </div>
                  <button onClick={handleRegistrarCompra} disabled={loadingCompras}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50 transition">
                    {loadingCompras ? 'Procesando...' : 'Confirmar Compra (Suma Stock)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {activeTab === 'historial' && <HistorialTab />}
    </div>
  );
}
