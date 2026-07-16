'use client';

import React, { useState } from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import NotesWidget from '@/components/NotesWidget';

export default function FloatingWidgetsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col-reverse items-center gap-4">
      {/* Main FAB Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 rotate-45 scale-90'
            : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white hover:scale-105 shadow-violet-500/30'
        }`}
      >
        <Settings className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Menu Items */}
      <div 
        className={`flex flex-col-reverse items-center gap-4 transition-all duration-300 origin-bottom ${
          isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-50 pointer-events-none'
        }`}
      >
        {/* Notes Widget */}
        <NotesWidget />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#1a1a24] border border-zinc-200 dark:border-white/10 shadow-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-all hover:scale-110"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-violet-600" />
          )}
          <span className="absolute left-full ml-4 whitespace-nowrap rounded-lg bg-zinc-800 dark:bg-white px-2 py-1 text-xs font-medium text-white dark:text-zinc-900 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none shadow-xl">
            Tema {theme === 'dark' ? 'Claro' : 'Oscuro'}
          </span>
        </button>
      </div>
    </div>
  );
}
