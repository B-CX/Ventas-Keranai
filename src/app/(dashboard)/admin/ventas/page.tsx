'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Search,
  Download,
  Calendar,
  User,
  Users,
  Eye,
  X,
  TrendingUp,
  FileText,
  Clock,
} from 'lucide-react';

interface VentaItem {
  id: string;
  cantidad: number;
  precio: number;
  variante: {
    nombre: string;
    producto: {
      nombre: string;
    };
  };
}

interface Venta {
  id: string;
  createdAt: string;
  total: number;
  notas: string | null;
  vendedor: {
    name: string;
  };
  cliente: {
    nombre: string;
    telefono: string | null;
    email: string | null;
  } | null;
  items: VentaItem[];
}

interface FilterOption {
  id: string;
  name: string;
}

export default function VentasPage() {
  const { data: session } = useSession();

  // Redirigir si no es admin
  useEffect(() => {
    if (session && (session.user as any)?.role !== 'ADMIN') {
      redirect('/venta');
    }
  }, [session]);

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  // Opciones de filtro
  const [vendedores, setVendedores] = useState<FilterOption[]>([]);
  const [clientes, setClientes] = useState<FilterOption[]>([]);

  // Estado de filtros
  const [vendedorId, setVendedorId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detalle de Venta
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchFilters = async () => {
    try {
      // Cargar vendedores
      const resVendedores = await fetch('/api/usuarios');
      const dataVendedores = await resVendedores.json();
      if (resVendedores.ok) {
        setVendedores(dataVendedores.map((v: any) => ({ id: v.id, name: v.name })));
      }

      // Cargar clientes
      const resClientes = await fetch('/api/clientes');
      const dataClientes = await resClientes.json();
      if (resClientes.ok) {
        setClientes(dataClientes.map((c: any) => ({ id: c.id, name: c.nombre })));
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (vendedorId) queryParams.append('vendedorId', vendedorId);
      if (clienteId) queryParams.append('clienteId', clienteId);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await fetch(`/api/ventas?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setVentas(data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchVentas();
  }, [vendedorId, clienteId, startDate, endDate]);

  const handleClearFilters = () => {
    setVendedorId('');
    setClienteId('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const queryParams = new URLSearchParams();
    if (vendedorId) queryParams.append('vendedorId', vendedorId);
    if (clienteId) queryParams.append('clienteId', clienteId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Redirigir al endpoint de exportación
    window.location.href = `/api/ventas/export?${queryParams.toString()}`;
  };

  const handleOpenDetail = (venta: Venta) => {
    setSelectedVenta(venta);
    setShowDetailModal(true);
  };

  // Calcular el total de las ventas filtradas
  const totalFiltrado = ventas.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6">
      {/* Tarjeta de Resumen Rápido con Filtros */}
      <div className="glass-panel rounded-2xl border border-white/5 p-6 shadow-xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400 border border-violet-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400">Total en Ventas Filtradas</h3>
              <p className="text-2xl font-bold text-white mt-0.5">
                ${totalFiltrado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Exportar a CSV
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 border-t border-white/5 pt-6">
          {/* Vendedor */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Vendedor</label>
            <select
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-3 py-2.5 text-xs text-white outline-none transition focus:border-violet-500"
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-3 py-2.5 text-xs text-white outline-none transition focus:border-violet-500"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Fecha Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-3 py-2.5 text-xs text-white outline-none transition focus:border-violet-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Fecha Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c0c14] px-3 py-2.5 text-xs text-white outline-none transition focus:border-violet-500"
            />
          </div>

          {/* Limpiar Filtros */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition duration-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Ventas */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : ventas.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-12 text-center border border-white/5">
          <TrendingUp className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No se registraron ventas</h3>
          <p className="text-zinc-500 text-sm mt-1">Intenta ajustando los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-300">
              <thead className="bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Cant. Productos</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ventas.map((venta) => {
                  const cantProductos = venta.items.reduce((acc, curr) => acc + curr.cantidad, 0);
                  return (
                    <tr key={venta.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
                          <div>
                            <p className="font-medium text-white">
                              {new Date(venta.createdAt).toLocaleDateString('es-AR')}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {new Date(venta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-zinc-500" />
                          <span>{venta.vendedor.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-zinc-500" />
                          <span className="font-semibold text-zinc-100">
                            {venta.cliente?.nombre || 'Cliente Ocasional'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {cantProductos} {cantProductos === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-6 py-4 font-bold text-violet-400">
                        ${venta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(venta)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition inline-flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalle de Venta */}
      {showDetailModal && selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Detalle de Venta</h3>
                <p className="text-xs text-zinc-500 mt-0.5">ID Venta: {selectedVenta.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedVenta(null);
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {/* Info de la Venta */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/[0.01] border border-white/5 p-4 text-xs">
                <div>
                  <p className="text-zinc-500 font-semibold uppercase">Fecha y Hora</p>
                  <p className="text-zinc-200 mt-1 font-medium">
                    {new Date(selectedVenta.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 font-semibold uppercase">Vendedor</p>
                  <p className="text-zinc-200 mt-1 font-medium">{selectedVenta.vendedor.name}</p>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-3">
                  <p className="text-zinc-500 font-semibold uppercase">Cliente</p>
                  <p className="text-zinc-200 mt-1 font-bold">
                    {selectedVenta.cliente?.nombre || 'Cliente Ocasional'}
                  </p>
                  {selectedVenta.cliente && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {selectedVenta.cliente.telefono && `Tel: ${selectedVenta.cliente.telefono} • `}
                      {selectedVenta.cliente.email && `Email: ${selectedVenta.cliente.email}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Productos de la venta */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Items Vendidos</h4>
                <div className="space-y-2">
                  {selectedVenta.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {item.variante.producto.nombre}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Variante: {item.variante.nombre}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-zinc-200">
                          ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          ${item.precio.toLocaleString('es-AR')} x {item.cantidad}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {selectedVenta.notas && (
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-xs">
                  <p className="text-zinc-500 font-semibold uppercase mb-1">Notas de Venta</p>
                  <p className="text-zinc-300 leading-relaxed">{selectedVenta.notas}</p>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-white/5 pt-4 shrink-0 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-400">Total Facturado</span>
              <span className="text-xl font-bold text-violet-400">
                ${selectedVenta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-end pt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedVenta(null);
                }}
                className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-white transition duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
