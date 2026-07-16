'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Plus,
  User,
  Mail,
  UserCheck,
  UserX,
  X,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  activo: boolean;
  createdAt: string;
}

export default function UsuariosPage() {
  const { data: session } = useSession();

  // Redirect if not admin (double protection, middleware also does this)
  useEffect(() => {
    if (session && (session.user as any)?.role !== 'ADMIN') {
      redirect('/venta');
    }
  }, [session]);

  const [usuarios, setUsuarios] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VENDEDOR');
  const [activo, setActivo] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (res.ok) {
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('VENDEDOR');
    setActivo(true);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Empty means don't change password
    setRole(user.role);
    setActivo(user.activo);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleToggleStatus = async (user: UserItem) => {
    // Evitar que el admin se desactive a sí mismo
    if (user.id === (session?.user as any)?.id) {
      alert('No podés desactivar tu propia cuenta.');
      return;
    }

    const nextStatus = !user.activo;
    const confirmMessage = nextStatus
      ? `¿Querés activar la cuenta de ${user.name}?`
      : `¿Querés desactivar la cuenta de ${user.name}? Los usuarios desactivados no podrán iniciar sesión.`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nextStatus }),
      });

      if (res.ok) {
        fetchUsuarios();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al cambiar el estado del usuario.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim()) {
      setFormError('Nombre y email son requeridos.');
      return;
    }

    if (!selectedUser && !password.trim()) {
      setFormError('La contraseña es requerida para usuarios nuevos.');
      return;
    }

    setSubmitting(true);

    const payload: any = {
      name,
      email,
      role,
      activo,
    };

    if (password.trim()) {
      payload.password = password;
    }

    try {
      const url = selectedUser ? `/api/usuarios/${selectedUser.id}` : '/api/usuarios';
      const method = selectedUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowFormModal(false);
        fetchUsuarios();
      } else {
        setFormError(data.error || 'Error al procesar la solicitud.');
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
      {/* Botón de Crear */}
      <div className="flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Crear Usuario
        </button>
      </div>

      {/* Lista de Usuarios */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/5 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-300">
              <thead className="bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usuarios.map((user) => {
                  const isSelf = user.id === (session?.user as any)?.id;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-white/[0.01] transition-colors ${
                        !user.activo ? 'opacity-60 bg-red-500/[0.005]' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-white truncate flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="rounded bg-violet-500/10 px-1 py-0.2 text-[9px] font-medium text-violet-400 border border-violet-500/20">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border border-white/5'
                        }`}>
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          disabled={isSelf}
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border transition ${
                            user.activo
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          } ${isSelf ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                        >
                          {user.activo ? (
                            <>
                              <UserCheck className="h-3 w-3" /> Activo
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3" /> Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition inline-flex items-center gap-1 text-xs font-medium"
                          title="Editar datos / contraseña"
                        >
                          <KeyRound className="h-4 w-4" />
                          <span>Editar</span>
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

      {/* Modal Crear / Editar */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white">
                {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                <div className="relative mt-2">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Carlos"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Correo Electrónico
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@ventas.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {selectedUser ? 'Cambiar Contraseña (dejar en blanco para no modificar)' : 'Contraseña'}
                </label>
                <div className="relative mt-2">
                  <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!selectedUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={selectedUser ? 'Nueva contraseña' : '••••••••'}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Rol del Usuario
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#12121a] px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500"
                >
                  <option value="VENDEDOR">Vendedor (Solo registrar venta y ver stock)</option>
                  <option value="ADMIN">Admin (Acceso completo)</option>
                </select>
              </div>

              {selectedUser && selectedUser.id !== (session?.user as any)?.id && (
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <input
                    type="checkbox"
                    id="user-activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/[0.04] text-violet-600 focus:ring-violet-500/20"
                  />
                  <label htmlFor="user-activo" className="text-sm font-semibold text-white cursor-pointer select-none">
                    Cuenta Activa (Habilita el inicio de sesión)
                  </label>
                </div>
              )}

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
    </div>
  );
}
