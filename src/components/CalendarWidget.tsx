'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CalendarWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setPosition({ x: typeof window !== 'undefined' ? window.innerWidth - 320 : 0, y: 80 });
  }, []);

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

  const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setIsOpen(false);
    router.push(`/admin/calendario?date=${dateStr}`);
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      days.push(
        <div 
          key={i} 
          onClick={() => handleDayClick(i)}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors cursor-pointer ${
            isToday 
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30' 
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
          }`}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  const calendarPopover = (
    <div 
      ref={popoverRef}
      style={{ left: position.x, top: position.y }}
      className={`fixed w-72 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#12121a]/95 p-4 shadow-2xl backdrop-blur-xl z-[100] ${isDragging ? 'cursor-grabbing opacity-90' : 'animate-fade-in'}`}
    >
      <div 
        className="flex items-center justify-between mb-2 px-1 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Calendario</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 mt-2">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="relative font-semibold text-zinc-800 dark:text-white flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/10 px-2 py-1 rounded-lg cursor-pointer transition-colors group">
          <CalendarIcon className="h-4 w-4 text-zinc-400 group-hover:text-violet-500 transition-colors" />
          <span>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <input
            type="month"
            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => {
              if (e.target.value) {
                const [year, month] = e.target.value.split('-');
                setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1));
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );

  return (
    <>
      {isOpen && isMounted && createPortal(calendarPopover, document.body)}

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-xl border border-zinc-200 dark:border-white/10 p-2 transition-all duration-200 shadow-sm dark:shadow-none ${
          isOpen 
            ? 'bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white' 
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
        }`}
        title="Calendario"
      >
        <CalendarIcon className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}
