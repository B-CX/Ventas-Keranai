'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { StickyNote, X, Trash2 } from 'lucide-react';

export default function NotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [notes, setNotes] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Position it in the top right
    setPosition({ x: typeof window !== 'undefined' ? window.innerWidth - 350 : 0, y: 80 });
    
    // Load saved notes
    const savedNotes = localStorage.getItem('quick_notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem('quick_notes', val);
  };

  const clearNotes = () => {
    if (window.confirm('¿Seguro que deseas borrar todas las notas rápidas?')) {
      setNotes('');
      localStorage.removeItem('quick_notes');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const notesPopover = (
    <div 
      ref={popoverRef}
      style={{ left: position.x, top: position.y }}
      className={`fixed w-80 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#12121a]/95 p-4 shadow-2xl backdrop-blur-xl z-[100] flex flex-col h-96 ${isDragging ? 'cursor-grabbing opacity-90' : 'animate-fade-in'}`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between mb-3 px-1 cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <StickyNote className="h-4 w-4" />
          <span className="text-sm font-semibold">Bloc de Notas</span>
        </div>
        <div className="flex items-center gap-1">
          {notes && (
            <button 
              onClick={(e) => { e.stopPropagation(); clearNotes(); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 transition"
              title="Borrar todas las notas"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-white transition"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Escribe tus notas rápidas aquí...&#10;(Se guardan automáticamente)"
        className="flex-1 w-full resize-none rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none focus:border-amber-500/50 focus:bg-white dark:focus:bg-black/40 transition-colors"
      />
    </div>
  );

  return (
    <>
      {isOpen && isMounted && createPortal(notesPopover, document.body)}

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-xl border border-zinc-200 dark:border-white/10 p-2 transition-all duration-200 shadow-sm dark:shadow-none ${
          isOpen 
            ? 'bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white' 
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
        }`}
        title="Bloc de Notas"
      >
        <StickyNote className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}
