'use client';

import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import CalendarWidget from '@/components/CalendarWidget';
import NotesWidget from '@/components/NotesWidget';

interface HeaderProps {
  onMenuOpen: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Generar título legible basado en la ruta
  const getTitle = () => {
    if (pathname.startsWith('/admin/productos')) return 'Gestión de Productos';
    if (pathname.startsWith('/admin/clientes')) return 'CRM de Clientes';
    if (pathname.startsWith('/admin/ventas')) return 'Historial de Ventas';
    if (pathname.startsWith('/admin/usuarios')) return 'Gestión de Usuarios';
    if (pathname === '/venta') return 'Nueva Venta';
    if (pathname === '/admin') return 'Panel de Inicio';
    return 'Sistema de Ventas';
  };

  return (
    <header className="relative z-50 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-[#0c0c14]/40 px-6 backdrop-blur-md lg:px-8 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuOpen}
          className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white lg:hidden transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-white tracking-tight">{getTitle()}</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Toolbar group */}
        <div className="flex items-center gap-2">
          <CalendarWidget />
          <NotesWidget />
          
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-zinc-200 dark:border-white/10 p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px] text-amber-400" /> : <Moon className="h-[18px] w-[18px] text-violet-600" />}
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-white/[0.02] px-3 py-1">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Online</span>
        </div>
      </div>
    </header>
  );
}
