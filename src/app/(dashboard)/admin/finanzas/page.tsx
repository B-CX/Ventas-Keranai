'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingDown, Plus, Tag, Search, Check, AlertCircle } from 'lucide-react';

export default function FinanzasPage() {
  const [activeTab, setActiveTab] = useState<'gastos' | 'compras'>('gastos');

  // Gastos
  const [categorias, setCategorias] = useState<any[]>([]);
  const [newCatNombre, setNewCatNombre] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoDesc, setGastoDesc] = useState('');
  const [gastoCatId, setGastoCatId] = useState('');
  const [gastoMoneda, setGastoMoneda] = useState('PYG');
  const [loadingGastos, setLoadingGastos] = useState(false);

  // Compras
  const [productSearch, setProductSearch] = useState('');
  const [productsFound, setProductsFound] = useState<any[]>([]);
  const [compraItems, setCompraItems] = useState<any[]>([]);
  const [proveedor, setProveedor] = useState('');
  const [compraMoneda, setCompraMoneda] = useState('PYG');
  const [loadingCompras, setLoadingCompras] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const res = await fetch('/api/gastos/categorias');
    if (res.ok) {
      setCategorias(await res.json());
    }
  };

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNombre) return;
    const res = await fetch('/api/gastos/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newCatNombre })
    });
    if (res.ok) {
      setNewCatNombre('');
      fetchCategorias();
    }
  };

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGastos(true);
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoriaId: gastoCatId,
        monto: gastoMonto,
        descripcion: gastoDesc,
        moneda: gastoMoneda
      })
    });
    setLoadingGastos(false);
    if (res.ok) {
      setGastoMonto('');
      setGastoDesc('');
      alert('Gasto registrado con éxito (restado de caja si hay una abierta).');
    } else {
      alert('Error al registrar gasto');
    }
  };

  // Buscar Productos para Compras
  useEffect(() => {
    if (productSearch.trim().length === 0) {
      setProductsFound([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      const res = await fetch(`/api/productos?q=${encodeURIComponent(productSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setProductsFound(data.filter((p: any) => p.activo && p.variantes.length > 0));
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [productSearch]);

  const handleAddCompraItem = (variante: any, productoNombre: string) => {
    const existing = compraItems.find(i => i.varianteId === variante.id);
    if (existing) {
      setCompraItems(compraItems.map(i => i.varianteId === variante.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCompraItems([...compraItems, {
        varianteId: variante.id,
        productoNombre,
        varianteNombre: variante.nombre,
        cantidad: 1,
        costoUnit: variante.precio / 2 // Sugerencia inicial, el usuario lo debe editar
      }]);
    }
    setProductSearch('');
  };

  const handleRegistrarCompra = async () => {
    if (compraItems.length === 0) return;
    setLoadingCompras(true);
    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proveedor,
        moneda: compraMoneda,
        items: compraItems
      })
    });
    setLoadingCompras(false);
    if (res.ok) {
      setCompraItems([]);
      setProveedor('');
      alert('Compra registrada. ¡Stock actualizado y monto restado de caja!');
    } else {
      alert('Error al registrar compra');
    }
  };

  const totalCompra = compraItems.reduce((acc, item) => acc + (item.costoUnit * item.cantidad), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Finanzas y Compras</h1>
        <p className="text-zinc-400">Registra gastos operativos y compras de mercadería (suma stock).</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('gastos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'gastos' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          <TrendingDown className="w-5 h-5" /> Gastos Operativos
        </button>
        <button 
          onClick={() => setActiveTab('compras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'compras' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          <ShoppingCart className="w-5 h-5" /> Ingreso de Mercadería
        </button>
      </div>

      {activeTab === 'gastos' && (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          {/* Registrar Gasto */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Registrar Nuevo Gasto</h2>
            <form onSubmit={handleCrearGasto} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Categoría</label>
                <select 
                  required 
                  value={gastoCatId} 
                  onChange={e => setGastoCatId(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Monto (Efectivo)</label>
                  <input 
                    type="number" required min="1" step="0.01"
                    value={gastoMonto} onChange={e => setGastoMonto(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Moneda</label>
                  <select 
                    value={gastoMoneda} onChange={e => setGastoMoneda(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="PYG">Guaraníes (PYG)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descripción / Justificativo</label>
                <input 
                  type="text" required
                  value={gastoDesc} onChange={e => setGastoDesc(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <button 
                type="submit" disabled={loadingGastos || !gastoCatId}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 mt-4"
              >
                {loadingGastos ? 'Guardando...' : 'Registrar Gasto (Resta en Caja)'}
              </button>
            </form>
          </div>

          {/* Categorias de Gastos */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 h-fit">
            <h2 className="text-xl font-bold text-white mb-6">Categorías de Gastos</h2>
            <form onSubmit={handleCrearCategoria} className="flex gap-2 mb-6">
              <input 
                type="text" required placeholder="Ej. LUZ, INTERNET, SUELDOS"
                value={newCatNombre} onChange={e => setNewCatNombre(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none uppercase"
              />
              <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4"/> Agregar
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {categorias.map(c => (
                <span key={c.id} className="bg-white/5 border border-white/10 text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-violet-400"/> {c.nombre}
                </span>
              ))}
              {categorias.length === 0 && <p className="text-sm text-zinc-500 italic">No hay categorías. Crea una arriba.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compras' && (
        <div className="grid md:grid-cols-12 gap-8 animate-fade-in">
          {/* Buscador de productos */}
          <div className="md:col-span-5 space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Ingresar Mercadería</h2>
              <div className="relative mb-4">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar producto para sumar stock..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
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
                            <button 
                              onClick={() => handleAddCompraItem(v, p.nombre)}
                              className="text-indigo-400 hover:text-white hover:bg-indigo-500/20 px-2 py-1 rounded transition"
                            >
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

          {/* Carrito de Compras (Ingreso) */}
          <div className="md:col-span-7">
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <h2 className="text-xl font-bold text-white mb-4">Detalle de Compra a Proveedor</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-bold mb-1">Proveedor (Opcional)</label>
                  <input 
                    type="text" value={proveedor} onChange={e => setProveedor(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-zinc-400 font-bold mb-1">Moneda de Pago</label>
                  <select 
                    value={compraMoneda} onChange={e => setCompraMoneda(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-white text-sm outline-none focus:border-indigo-500"
                  >
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
                    <div className="col-span-3">Costo Unitario</div>
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
                        <input 
                          type="number" value={item.costoUnit}
                          onChange={e => {
                            const newItems = [...compraItems];
                            newItems[idx].costoUnit = Number(e.target.value);
                            setCompraItems(newItems);
                          }}
                          className="w-full bg-transparent border-b border-white/20 text-white text-sm outline-none px-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" value={item.cantidad} min="1"
                          onChange={e => {
                            const newItems = [...compraItems];
                            newItems[idx].cantidad = Number(e.target.value);
                            setCompraItems(newItems);
                          }}
                          className="w-full bg-transparent border-b border-white/20 text-white text-sm outline-none px-1"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button 
                          onClick={() => setCompraItems(compraItems.filter(i => i.varianteId !== item.varianteId))}
                          className="text-red-400 hover:text-red-300 p-1"
                        >×</button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-4">
                    <span className="text-zinc-400 font-bold">Total Compra:</span>
                    <span className="text-2xl font-bold text-indigo-400">{compraMoneda === 'PYG' ? '₲' : '$'} {totalCompra.toLocaleString(undefined, {minimumFractionDigits: compraMoneda === 'USD' ? 2 : 0})}</span>
                  </div>
                  
                  <button 
                    onClick={handleRegistrarCompra}
                    disabled={loadingCompras}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50 transition"
                  >
                    {loadingCompras ? 'Procesando...' : 'Confirmar Compra (Suma Stock)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
