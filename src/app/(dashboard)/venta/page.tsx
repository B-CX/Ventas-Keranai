'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search,
  Plus,
  Trash2,
  User,
  PlusCircle,
  X,
  ShoppingBag,
  CreditCard,
  UserPlus,
  TrendingDown,
  ChevronRight,
  Package,
} from 'lucide-react';

interface Variante {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  sku?: string | null;
}

interface Grupo {
  id: string;
  nombre: string;
}

interface Categoria {
  id: string;
  nombre: string;
  grupoId: string;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: { id: string, nombre: string, grupo: { id: string, nombre: string } } | null;
  activo: boolean;
  variantes: Variante[];
}

interface CartItem {
  varianteId: string;
  productoNombre: string;
  varianteNombre: string;
  precio: number;
  cantidad: number;
  stockDisponible: number;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
}

export default function NuevaVentaPage() {
  const { data: session } = useSession();

  // Búsqueda de Productos
  const [productSearch, setProductSearch] = useState('');
  const [productsFound, setProductsFound] = useState<Producto[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Filtros de Catálogo
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState('');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Persistencia de filtros
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGrupo = localStorage.getItem('pos_venta_filterGrupoId');
      const savedCategoria = localStorage.getItem('pos_venta_filterCategoriaId');
      const savedSort = localStorage.getItem('pos_venta_sortOrder');
      if (savedGrupo) setSelectedGrupoId(savedGrupo);
      if (savedCategoria) setSelectedCategoriaId(savedCategoria);
      if (savedSort) setSortOrder(savedSort);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_venta_filterGrupoId', selectedGrupoId);
    localStorage.setItem('pos_venta_filterCategoriaId', selectedCategoriaId);
    localStorage.setItem('pos_venta_sortOrder', sortOrder);
  }, [selectedGrupoId, selectedCategoriaId, sortOrder]);

  // Selector de Variante
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Producto | null>(null);
  
  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notas, setNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  
  // Multi-moneda
  const [cotizacionUsd, setCotizacionUsd] = useState<number>(7500);
  const [monedaCobro, setMonedaCobro] = useState('PYG');

  // Clientes
  const [clientSearch, setClientSearch] = useState('');
  const [clientesFound, setClientesFound] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchingClientes, setSearchingClientes] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Formulario Nuevo Cliente
  const [newClientNombre, setNewClientNombre] = useState('');
  const [newClientTelefono, setNewClientTelefono] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientNotas, setNewClientNotas] = useState('');
  const [savingClient, setSavingClient] = useState(false);
  const [newClientError, setNewClientError] = useState<string | null>(null);

  // Estado de envío
  const [submittingVenta, setSubmittingVenta] = useState(false);
  const [ventaError, setVentaError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastVentaId, setLastVentaId] = useState('');

  // Cargar Grupos y Categorías
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [resG, resC] = await Promise.all([
          fetch('/api/productos/grupos'),
          fetch('/api/productos/categorias')
        ]);
        if (resG.ok) setGrupos(await resG.json());
        if (resC.ok) setCategorias(await resC.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchCatalog();
  }, []);

  // Buscar Productos en API
  useEffect(() => {
    if (productSearch.trim().length === 0 && !selectedCategoriaId && !selectedGrupoId) {
      setProductsFound([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        let url = `/api/productos?q=${encodeURIComponent(productSearch)}`;
        if (selectedCategoriaId) {
          url += `&categoriaId=${selectedCategoriaId}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          let filtrados = data.filter((p: Producto) => p.activo && p.variantes.length > 0);
          
          // Si hay grupo pero no categoría, filtramos en el cliente (opcional)
          if (selectedGrupoId && !selectedCategoriaId) {
            filtrados = filtrados.filter((p: Producto) => p.categoria?.grupo?.id === selectedGrupoId);
          }
          
          setProductsFound(filtrados);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingProducts(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [productSearch, selectedCategoriaId, selectedGrupoId]);

  // Cargar Cotización USD
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/configuracion');
        if (res.ok) {
          const data = await res.json();
          if (data.cotizacionUsd) {
            setCotizacionUsd(data.cotizacionUsd);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  // Buscar Clientes en API
  useEffect(() => {
    if (clientSearch.trim().length === 0) {
      setClientesFound([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingClientes(true);
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(clientSearch)}`);
        const data = await res.json();
        if (res.ok) {
          setClientesFound(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingClientes(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [clientSearch]);

  // Agregar al Carrito
  const handleSelectVariant = (variante: Variante) => {
    if (!selectedProductForVariant) return;

    if (variante.stock <= 0) {
      alert('Esta variante no tiene stock disponible.');
      return;
    }

    // Verificar si ya existe en el carrito
    const existingIndex = cart.findIndex((item) => item.varianteId === variante.id);
    
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].cantidad;
      if (currentQty >= variante.stock) {
        alert(`No podés agregar más unidades. Stock disponible: ${variante.stock}`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].cantidad += 1;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        varianteId: variante.id,
        productoNombre: selectedProductForVariant.nombre,
        varianteNombre: variante.nombre,
        precio: variante.precio,
        cantidad: 1,
        stockDisponible: variante.stock,
      };
      setCart([...cart, newItem]);
    }

    setSelectedProductForVariant(null);
    setProductSearch('');
  };

  const handleUpdateQty = (varianteId: string, delta: number) => {
    const item = cart.find((i) => i.varianteId === varianteId);
    if (!item) return;

    const nextQty = item.cantidad + delta;
    if (nextQty <= 0) {
      setCart(cart.filter((i) => i.varianteId !== varianteId));
      return;
    }

    if (nextQty > item.stockDisponible) {
      alert(`No podés superar el stock disponible de ${item.stockDisponible} unidades.`);
      return;
    }

    setCart(
      cart.map((i) => (i.varianteId === varianteId ? { ...i, cantidad: nextQty } : i))
    );
  };

  const handleRemoveItem = (varianteId: string) => {
    setCart(cart.filter((i) => i.varianteId !== varianteId));
  };

  // Crear Cliente
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientNombre.trim()) return;

    setSavingClient(true);
    setNewClientError(null);

    const payload = {
      nombre: newClientNombre,
      telefono: newClientTelefono || null,
      email: newClientEmail || null,
      notas: newClientNotas || null,
    };

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedCliente(data);
        setShowAddClientModal(false);
        setNewClientNombre('');
        setNewClientTelefono('');
        setNewClientEmail('');
        setNewClientNotas('');
      } else {
        setNewClientError(data.error || 'Error al crear el cliente.');
      }
    } catch (err) {
      setNewClientError('Ocurrió un error inesperado.');
      console.error(err);
    } finally {
      setSavingClient(false);
    }
  };

  // Confirmar Venta
  const handleConfirmVenta = async () => {
    if (cart.length === 0) return;

    setSubmittingVenta(true);
    setVentaError(null);

    const payload = {
      clienteId: selectedCliente?.id || null,
      notas: notas || null,
      metodoPago,
      monedaCobro,
      cotizacionUsd: monedaCobro === 'USD' ? cotizacionUsd : null,
      items: cart.map((item) => ({
        varianteId: item.varianteId,
        cantidad: item.cantidad,
      })),
    };

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setLastVentaId(data.id);
        setShowSuccessModal(true);
        // Limpiar estado
        setCart([]);
        setNotas('');
        setMetodoPago('EFECTIVO');
        setMonedaCobro('PYG');
        setSelectedCliente(null);
        setClientSearch('');
      } else {
        setVentaError(data.error || 'Error al procesar la venta.');
      }
    } catch (err) {
      setVentaError('Error de red al procesar la venta.');
      console.error(err);
    } finally {
      setSubmittingVenta(false);
    }
  };

  // Totales
  const totalVenta = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      {/* Columna Izquierda: Buscar Productos */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-panel rounded-2xl border border-white/5 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-violet-400" />
            Buscar Producto
          </h3>

          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Ingresá nombre del producto..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0c0c14] pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedGrupoId}
              onChange={(e) => {
                setSelectedGrupoId(e.target.value);
                setSelectedCategoriaId(''); // Reset category when group changes
              }}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
            >
              <option value="">Todos los Grupos</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>

            <select
              value={selectedCategoriaId}
              onChange={(e) => setSelectedCategoriaId(e.target.value)}
              disabled={!selectedGrupoId && categorias.length > 0 === false}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition disabled:opacity-50"
            >
              <option value="">Todas las Categorías</option>
              {categorias
                .filter(c => !selectedGrupoId || c.grupoId === selectedGrupoId)
                .map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition"
            >
              <option value="newest">Más Nuevos</option>
              <option value="name-asc">Orden Alfabético</option>
              <option value="price-desc">Mayor Precio</option>
            </select>
          </div>

          {/* Resultados de búsqueda de productos */}
          {searchingProducts && (
            <div className="py-2 text-center text-xs text-zinc-500">Buscando productos...</div>
          )}

          {productsFound.length > 0 && (
            <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#0c0c14] overflow-hidden max-h-[300px] overflow-y-auto">
              {[...productsFound].sort((a, b) => {
                if (sortOrder === 'name-asc') return a.nombre.localeCompare(b.nombre);
                if (sortOrder === 'price-desc') {
                  const maxA = Math.max(...a.variantes.map(v => v.precio), 0);
                  const maxB = Math.max(...b.variantes.map(v => v.precio), 0);
                  return maxB - maxA;
                }
                return 0;
              }).map((producto) => (
                <div
                  key={producto.id}
                  onClick={() => setSelectedProductForVariant(producto)}
                  className="flex items-center justify-between p-3.5 hover:bg-white/[0.03] cursor-pointer transition text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">{producto.nombre}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {producto.categoria ? `${producto.categoria.grupo.nombre} > ${producto.categoria.nombre}` : 'Sin Categoría'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              ))}
            </div>
          )}

          {productSearch && !searchingProducts && productsFound.length === 0 && (
            <p className="text-xs text-zinc-500 italic">No se encontraron productos activos con ese nombre.</p>
          )}
        </div>

        {/* Variantes del Producto Seleccionado */}
        {selectedProductForVariant && (
          <div className="glass-panel rounded-2xl border border-white/10 p-6 bg-gradient-to-br from-violet-950/10 to-indigo-950/10 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-400">Seleccionar Variante</span>
                <h4 className="text-lg font-bold text-white mt-0.5">{selectedProductForVariant.nombre}</h4>
              </div>
              <button
                onClick={() => setSelectedProductForVariant(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {selectedProductForVariant.variantes.map((variante) => (
                <div
                  key={variante.id}
                  onClick={() => handleSelectVariant(variante)}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition text-left cursor-pointer ${
                    variante.stock <= 0
                      ? 'border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500'
                  }`}
                >
                  <p className="font-bold text-white text-sm">{variante.nombre}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-violet-400 font-bold">₲ {Math.round(variante.precio).toLocaleString('es-PY')}</span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      variante.stock === 0
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border border-white/5'
                    }`}>
                      {variante.stock} disp.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Carrito y Venta */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col justify-between min-h-[500px]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-violet-400" />
              Carrito de Ventas
            </h3>

            {/* Carrito Vacío */}
            {cart.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <ShoppingBag className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm">El carrito está vacío.</p>
                <p className="text-xs mt-1">Buscá un producto a la izquierda para agregarlo.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[250px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.varianteId} className="py-3 flex items-center justify-between gap-4">
                    <div className="overflow-hidden">
                      <p className="font-semibold text-white text-sm truncate">{item.productoNombre}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        Variante: {item.varianteNombre}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-bold">
                        ₲ {Math.round(item.precio).toLocaleString('es-PY')} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Cantidad */}
                      <div className="flex items-center rounded-lg border border-white/10 bg-[#0c0c14] overflow-hidden">
                        <button
                          onClick={() => handleUpdateQty(item.varianteId, -1)}
                          className="px-2 py-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-bold text-white">{item.cantidad}</span>
                        <button
                          onClick={() => handleUpdateQty(item.varianteId, 1)}
                          className="px-2 py-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      {/* Eliminar */}
                      <button
                        onClick={() => handleRemoveItem(item.varianteId)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
            {/* CRM de Cliente Asociado */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Cliente Asociado</label>
              
              {selectedCliente ? (
                <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/[0.02] p-3 text-sm">
                  <div>
                    <p className="font-bold text-white">{selectedCliente.nombre}</p>
                    {selectedCliente.telefono && <p className="text-xs text-zinc-400 mt-0.5">{selectedCliente.telefono}</p>}
                  </div>
                  <button
                    onClick={() => setSelectedCliente(null)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Buscar cliente existente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0c0c14] pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-violet-500"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddClientModal(true)}
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-3 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                      title="Registrar Cliente Nuevo"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Resultados clientes */}
                  {searchingClientes && (
                    <p className="text-[10px] text-zinc-500 italic">Buscando clientes...</p>
                  )}

                  {clientesFound.length > 0 && (
                    <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#0c0c14] overflow-hidden max-h-[150px] overflow-y-auto">
                      {clientesFound.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCliente(c);
                            setClientesFound([]);
                            setClientSearch('');
                          }}
                          className="p-2.5 hover:bg-white/[0.03] cursor-pointer transition text-xs flex justify-between"
                        >
                          <span className="font-semibold text-white">{c.nombre}</span>
                          <span className="text-zinc-500">{c.telefono || 'Sin tel.'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Método y Moneda de Pago */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA">💳 Tarjeta (Débito/Crédito)</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Moneda de Cobro</label>
                <select
                  value={monedaCobro}
                  onChange={(e) => setMonedaCobro(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500"
                >
                  <option value="PYG">🇵🇾 Guaraníes (PYG)</option>
                  <option value="USD">🇺🇸 Dólares (USD)</option>
                </select>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Notas de Venta</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Método de entrega, detalles especiales..."
                rows={2}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-4 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 resize-none"
              />
            </div>

            {/* Mensajes de error */}
            {ventaError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {ventaError}
              </div>
            )}

            {/* Total y Botón de Confirmación */}
            <div className="border-t border-white/5 pt-4 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Total a Pagar (Base)</span>
                  <span className="text-xl font-bold text-zinc-300">₲ {Math.round(totalVenta).toLocaleString('es-PY')}</span>
                </div>
                
                {monedaCobro === 'USD' && (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mt-2">
                    <div>
                      <span className="text-xs text-emerald-400 font-semibold uppercase block">Total en Dólares</span>
                      <span className="text-[10px] text-emerald-500">Cotización: ₲ {cotizacionUsd.toLocaleString('es-PY')}</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">
                      $ {(totalVenta / cotizacionUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmVenta}
                disabled={cart.length === 0 || submittingVenta}
                className="w-full relative flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {submittingVenta ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Confirmar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Agregar Cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white">Nuevo Cliente</h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-4">
              {newClientError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {newClientError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newClientNombre}
                  onChange={(e) => setNewClientNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={newClientTelefono}
                  onChange={(e) => setNewClientTelefono(e.target.value)}
                  placeholder="+54 11 1234 5678"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Notas
                </label>
                <textarea
                  value={newClientNotas}
                  onChange={(e) => setNewClientNotas(e.target.value)}
                  placeholder="Talle de remera, preferencias..."
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-55"
                >
                  {savingClient ? 'Guardando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Éxito Venta */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">¡Venta Registrada Exitosamente!</h3>
              <p className="text-xs text-zinc-500 mt-1">El stock se ha descontado correctamente.</p>
              <p className="text-[10px] font-semibold text-zinc-400 mt-2 bg-white/[0.02] border border-white/5 py-1.5 rounded-lg">
                ID Venta: {lastVentaId}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`/admin/ventas/${lastVentaId}/ticket`}
                target="_blank"
                className="w-full text-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-violet-500 hover:to-indigo-500 transition active:scale-[0.98]"
              >
                🖨️ Imprimir Ticket
              </a>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
