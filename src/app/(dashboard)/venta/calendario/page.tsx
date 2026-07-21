'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Clock,
} from 'lucide-react';

interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  start: string;
  end: string;
  todoElDia: boolean;
  recordatorio: boolean;
}

const COLORS = [
  { name: 'violeta', bg: 'bg-violet-500/10 dark:bg-violet-600/20 border-violet-500/30 dark:border-violet-500/50 text-violet-600 dark:text-violet-300', dot: 'bg-violet-500 dark:bg-violet-400' },
  { name: 'azul', bg: 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500/30 dark:border-blue-500/50 text-blue-600 dark:text-blue-300', dot: 'bg-blue-500 dark:bg-blue-400' },
  { name: 'verde', bg: 'bg-emerald-500/10 dark:bg-emerald-600/20 border-emerald-500/30 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  { name: 'rojo', bg: 'bg-rose-500/10 dark:bg-rose-600/20 border-rose-500/30 dark:border-rose-500/50 text-rose-600 dark:text-rose-300', dot: 'bg-rose-500 dark:bg-rose-400' },
  { name: 'amarillo', bg: 'bg-amber-500/10 dark:bg-amber-600/20 border-amber-500/30 dark:border-amber-500/50 text-amber-600 dark:text-amber-300', dot: 'bg-amber-500 dark:bg-amber-400' },
  { name: 'gris', bg: 'bg-zinc-500/10 dark:bg-zinc-600/20 border-zinc-500/30 dark:border-zinc-500/50 text-zinc-600 dark:text-zinc-300', dot: 'bg-zinc-500 dark:bg-zinc-400' },
];

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Componente de detalle de evento (definido fuera para evitar recreación)
function DetalleEventoModal({
  evento,
  onClose,
}: {
  evento: Evento;
  onClose: () => void;
}) {
  const colorStyle = COLORS.find((c) => c.name === evento.color) || COLORS[0];

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${colorStyle.dot}`} />
            <h3 className="text-lg font-semibold text-white truncate">{evento.nombre}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-zinc-300">
          <div className="flex items-start gap-2">
            <CalendarDays className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <p>{formatFecha(evento.start)}</p>
              {!evento.todoElDia && (
                <p className="text-zinc-400 mt-0.5">
                  {formatHora(evento.start)} — {formatHora(evento.end)}
                </p>
              )}
              {evento.todoElDia && (
                <p className="text-zinc-400 mt-0.5">Todo el día</p>
              )}
            </div>
          </div>

          {evento.recordatorio && (
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Recordatorio 30 min antes</span>
            </div>
          )}

          {evento.descripcion && (
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-zinc-400">
              {evento.descripcion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VentaCalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const timeMin = new Date(year, month - 1, 15).toISOString();
    const timeMax = new Date(year, month + 1, 15).toISOString();

    try {
      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
      );
      if (res.ok) {
        const data = await res.json();
        setEventos(data.events || []);
      }
    } catch {
      // silencioso: sin eventos no se rompe la vista
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const getGridDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const gridDays: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      gridDays.push({ date: new Date(year, month - 1, prevMonthTotalDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      gridDays.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - gridDays.length;
    for (let i = 1; i <= remaining; i++) {
      gridDays.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return gridDays;
  };

  const getEventsForDay = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return eventos.filter((evt) => evt.start.split('T')[0] === dStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen p-6 text-zinc-800 dark:text-white transition-colors duration-200">
      {/* Modal detalle */}
      {selectedEvento && (
        <DetalleEventoModal
          evento={selectedEvento}
          onClose={() => setSelectedEvento(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Calendario de Actividades</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Actividades y eventos del equipo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition shadow-sm dark:shadow-none"
          >
            Hoy
          </button>
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-0.5 shadow-sm dark:shadow-none">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative flex items-center group cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition overflow-hidden">
              <input
                type="month"
                value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  if (year && month) setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold select-none text-zinc-700 dark:text-zinc-200">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>{MESES[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grilla */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0c0c14]/40 overflow-hidden shadow-2xl transition-colors duration-200">
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03]">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-48">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="grid grid-cols-7 grid-rows-6">
            {getGridDays().map((cell, idx) => {
              const dayEvents = getEventsForDay(cell.date);
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-r border-b border-zinc-100 dark:border-white/5 p-2 flex flex-col gap-1 ${
                    cell.isCurrentMonth ? 'text-zinc-800 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center text-xs font-semibold rounded-full ${
                        isToday(cell.date) ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : ''
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map((evt) => {
                      const colorStyle = COLORS.find((c) => c.name === evt.color) || COLORS[0];
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvento(evt)}
                          className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-0.5 text-[10px] font-medium leading-normal cursor-pointer ${colorStyle.bg} transition hover:brightness-110`}
                          title={evt.nombre}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${colorStyle.dot}`} />
                          <span className="truncate flex-1">{evt.nombre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
