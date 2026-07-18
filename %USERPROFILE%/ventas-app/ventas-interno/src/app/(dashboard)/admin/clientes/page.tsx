'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  History,
  Edit2,
  X,
  ShoppingBag,
  Calendar,
  Users,
} from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  createdAt: string;
}

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
  items: VentaItem[];
}

interface ClienteDetalle extends Cliente {
  ventas: Venta[];
}

export default function ClientesCRM() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Formularios
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Historial
  const [clienteDetalle, setClienteDetalle] = useState<ClienteDetalle | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setClientes(data);
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setSelectedCliente(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    setNotas('');
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setNombre(cliente.nombre);
    setTelefono(cliente.telefono || '');
    setEmail(cliente.email || '');
    setNotas(cliente.notas || '');
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenHistory = async (clienteId: string) => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}`);
      const data = await res.json();
      if (res.ok) {
        setClienteDetalle(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nombre,
      telefono: telefono || null,
      email: email || null,
      notas: notas || null,
    };

    try {
      const url = selectedCliente ? `/api/clientes/${selectedCliente.id}` : '/api/clientes';
      const method = selectedCliente ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowFormModal(false);
        fetchClientes();
      } else {
        setFormError(data.error || 'Error al guardar el cliente.');
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
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-12 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-violet-500 focus:bg-white/[0.06]"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-12 text-center border border-white/5">
          <Users className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No se encontraron clientes</h3>
          <p className="text-zinc-500 text-sm mt-1">Crea un cliente nuevo para comenzar a asociarlo a tus ventas.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="glass-card flex flex-col justify-between rounded-2xl p-6">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(cliente)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenHistory(cliente.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                      title="Historial de compras"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-bold text-white truncate">{cliente.nombre}</h3>

                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                  {cliente.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-500 shrink-0" />
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-500 shrink-0 text-ellipsis overflow-hidden" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.notas && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-xs">{cliente.notas}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500">
                Registrado: {new Date(cliente.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear / Editar Cliente */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white">
                {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 11 1234 5678"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Notas / Observaciones
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles sobre talles, preferencias, etc..."
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:bg-white/[0.08] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
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
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Historial de Compras */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Historial de Compras</h3>
                {clienteDetalle && <p className="text-xs text-zinc-400 mt-0.5">{clienteDetalle.nombre}</p>}
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setClienteDetalle(null);
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {loadingHistory ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                </div>
              ) : !clienteDetalle || clienteDetalle.ventas.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Este cliente no registra compras en el sistema.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clienteDetalle.ventas.map((venta) => (
                    <div key={venta.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-2 text-xs">
                        <div className="flex items-center gap-4 text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(venta.createdAt).toLocaleDateString('es-AR')} {new Date(venta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>Vendedor: {venta.vendedor.name}</span>
                        </div>
                        <span className="font-semibold text-white">ID: {venta.id}</span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {venta.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-300">
                              {item.variante.producto.nombre} <span className="text-zinc-500">({item.variante.nombre})</span> x {item.cantidad}
                            </span>
                            <span className="text-zinc-400">${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>

                      {venta.notas && (
                        <div className="rounded bg-white/[0.02] p-2 text-xs text-zinc-500">
                          <strong>Notas de venta:</strong> {venta.notas}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-xs text-zinc-500">Total pagado</span>
                        <span className="text-base font-bold text-violet-400">${venta.total.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-white/5 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(false);
                  setClienteDetalle(null);
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
