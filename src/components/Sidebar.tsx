'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Home,
  ShoppingBag,
  Package,
  Users,
  UserCog,
  LogOut,
  X,
  TrendingUp,
  FileSpreadsheet,
  CalendarDays,
  Wallet,
  Calculator,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const defaultUserName = session?.user?.name || 'Usuario';
  const userEmail = session?.user?.email || '';

  const [appName, setAppName] = useState('Ventas Interno');
  const [appLogo, setAppLogo] = useState('/logo-keranai.png');
  const [displayName, setDisplayName] = useState(defaultUserName);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Fetch global config
    fetch('/api/configuracion')
      .then(res => res.json())
      .then(data => {
        if (data.appName) setAppName(data.appName);
        if (data.appLogo) setAppLogo(data.appLogo);
      })
      .catch(console.error);

    // Fetch user profile
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.name) setDisplayName(data.name);
        if (data.imagen) setAvatar(data.imagen);
      })
      .catch(console.error);
  }, []);

  const adminLinks = [
    { name: 'Inicio', href: '/admin', icon: Home },
    { name: 'Productos', href: '/admin/productos', icon: Package },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Ventas', href: '/admin/ventas', icon: TrendingUp },
    { name: 'Lista de Precios', href: '/admin/precios', icon: FileSpreadsheet },
    { name: 'Calendario', href: '/admin/calendario', icon: CalendarDays },
    { name: 'Nueva Venta', href: '/venta', icon: ShoppingBag },
    { name: 'Caja', href: '/admin/caja', icon: Wallet },
    { name: 'Finanzas', href: '/admin/finanzas', icon: Calculator },
    { name: 'Usuarios', href: '/admin/usuarios', icon: UserCog },
    { name: 'Configuraciones', href: '/admin/configuracion', icon: Settings },
  ];

  const sellerLinks = [
    { name: 'Nueva Venta', href: '/venta', icon: ShoppingBag },
    { name: 'Consultar Stock', href: '/admin/productos', icon: Package },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Calendario', href: '/admin/calendario', icon: CalendarDays },
    { name: 'Configuraciones', href: '/admin/configuracion', icon: Settings },
  ];

  const links = role === 'ADMIN' ? adminLinks : sellerLinks;

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#0c0c14]/90 backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header/Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-white/10">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-zinc-100 dark:bg-white/5 shadow-sm shadow-violet-600/10 dark:shadow-violet-600/20">
              <img
                src={appLogo}
                alt={appName}
                className="h-8 w-8 object-cover rounded-lg"
              />
            </div>
            <span className="font-bold tracking-tight text-zinc-800 dark:text-white truncate max-w-[150px]" title={appName}>{appName}</span>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 border-b border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="Perfil" className="h-10 w-10 rounded-xl object-cover border border-zinc-200 dark:border-white/10" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-violet-600 dark:text-violet-400 font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <h4 className="truncate text-sm font-semibold text-zinc-800 dark:text-white" title={displayName}>{displayName}</h4>
              <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-600/20 dark:to-indigo-600/20 border border-violet-500/20 dark:border-violet-500/30 text-violet-600 dark:text-white font-semibold shadow-inner'
                    : 'border border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-100 dark:border-white/5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
