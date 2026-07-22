'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  History,
  Edit2,
  Trash2,
  X,
  ShoppingBag,
  Calendar,
  Users,
} from 'lucide-react';
import ClienteFormModal from '@/components/ClienteFormModal';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  imagen: string | null;
  createdAt: string;
}

interface VentaItem {
  id: string;
  cantidad: number;
  precio: number;
  variante?: {
    nombre: string;
    producto?: {
      nombre: string;
    };
  } | null;
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
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  // Selección de cliente para editar o ver historial
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
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
    setShowFormModal(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
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

  const handleDelete = async (id: string, nombre: string) => {
    if (!isAdmin) return;
    if (!confirm(`⚠️ Atención: Estás por quitar al cliente "${nombre}".\n\nSus ventas registradas se mantendrán en el sistema, pero ya no tendrán este cliente asociado (quedarán como ventas anónimas).\n\n¿Estás seguro de continuar?`)) return;
    
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchClientes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar cliente');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al eliminar el cliente');
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
            <div key={cliente.id} className="glass-panel border border-white/10 rounded-2xl p-5 hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                  {cliente.imagen ? (
                    <img 
                      src={cliente.imagen} 
                      alt={cliente.nombre} 
                      className="h-12 w-12 rounded-xl object-cover border border-indigo-500/30 cursor-pointer hover:opacity-80 transition" 
                      onClick={() => setZoomImage(cliente.imagen)}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl uppercase">
                      {cliente.nombre.charAt(0)}
                    </div>
                  )}
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
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(cliente.id, cliente.nombre)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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

              <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500">
                Registrado: {new Date(cliente.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear / Editar Cliente Unificado */}
      <ClienteFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={() => fetchClientes()}
        clienteToEdit={selectedCliente}
        isAdmin={isAdmin}
      />

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
                              {item.variante?.producto?.nombre || 'Producto eliminado'} {item.variante?.nombre && <span className="text-zinc-500">({item.variante.nombre})</span>} x {item.cantidad}
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
      {/* Lightbox para Imágenes */}
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
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={() => setZoomImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

    </div>
  );
}
