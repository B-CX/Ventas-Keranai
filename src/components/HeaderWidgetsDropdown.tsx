'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import NotesWidget from '@/components/NotesWidget';

export default function HeaderWidgetsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-xl border border-zinc-200 dark:border-white/10 p-2 transition-all duration-200 shadow-sm dark:shadow-none ${
          isOpen 
            ? 'bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white' 
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
        }`}
        title="Herramientas y Widgets"
      >
        <Settings className={`h-[18px] w-[18px] transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#12121a]/95 py-2 shadow-2xl backdrop-blur-xl animate-fade-in z-50 overflow-hidden">
          <div className="px-4 py-2 mb-1 border-b border-zinc-100 dark:border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Herramientas</span>
          </div>
          <NotesWidget />

          <button
            onClick={() => {
              toggleTheme();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
            Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
          </button>
        </div>
      )}
    </div>
  );
}
