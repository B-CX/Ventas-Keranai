'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  Clock,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

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

export default function CalendarioPage() {
  const { data: session } = useSession();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  
  // Campos del Formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Check URL for date parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      if (dateParam) {
        const [year, month, day] = dateParam.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          // Note: month is 0-indexed in JS Date
          const targetDate = new Date(year, month - 1, day);
          if (!isNaN(targetDate.getTime())) {
            setCurrentDate(targetDate);
          }
        }
      }
    }
  }, []);
  const [color, setColor] = useState('violeta');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [todoElDia, setTodoElDia] = useState(false);
  const [recordatorio, setRecordatorio] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Carga eventos del mes actual
  const fetchEventos = useCallback(async () => {
    setLoading(true);
    setErrorGoogle(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const timeMin = new Date(year, month - 1, 15).toISOString();
    const timeMax = new Date(year, month + 1, 15).toISOString();

    try {
      const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar eventos.');
      } else {
        setEventos(data.events || []);
        if (!data.isGoogleConnected) {
          setErrorGoogle('Google Calendar no está conectado.');
        } else {
          setErrorGoogle(null);
        }
      }
    } catch {
      showToast('err', 'Error al cargar eventos del calendario.');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  // Genera grilla de días
  const getGridDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const gridDays: { date: Date; isCurrentMonth: boolean }[] = [];

    // Rellenar días del mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      gridDays.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Rellenar días del mes actual
    for (let i = 1; i <= totalDays; i++) {
      gridDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Rellenar días del mes siguiente para completar grilla (múltiplo de 7)
    const remaining = 42 - gridDays.length;
    for (let i = 1; i <= remaining; i++) {
      gridDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return gridDays;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Abre modal para crear
  const handleOpenCreate = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    
    setIsEditing(false);
    setActiveEventId(null);
    setNombre('');
    setDescripcion('');
    setColor('violeta');
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    setStartTime('09:00');
    setEndTime('10:00');
    setTodoElDia(false);
    setRecordatorio(false);
    
    setShowModal(true);
  };

  // Abre modal para editar
  const handleOpenEdit = (evt: Evento, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setActiveEventId(evt.id);
    setNombre(evt.nombre);
    setDescripcion(evt.descripcion);
    setColor(evt.color);
    setTodoElDia(evt.todoElDia);
    setRecordatorio(evt.recordatorio);

    if (evt.todoElDia) {
      setStartDate(evt.start.split('T')[0]);
      setEndDate(evt.end.split('T')[0]);
      setStartTime('00:00');
      setEndTime('23:59');
    } else {
      const sDate = new Date(evt.start);
      const eDate = new Date(evt.end);
      
      setStartDate(sDate.toISOString().split('T')[0]);
      setEndDate(eDate.toISOString().split('T')[0]);
      
      const sHours = String(sDate.getHours()).padStart(2, '0');
      const sMin = String(sDate.getMinutes()).padStart(2, '0');
      setStartTime(`${sHours}:${sMin}`);
      
      const eHours = String(eDate.getHours()).padStart(2, '0');
      const eMin = String(eDate.getMinutes()).padStart(2, '0');
      setEndTime(`${eHours}:${eMin}`);
    }
    
    setShowModal(true);
  };

  // Guardar (Crear o Editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSaving(true);
    let startIso = '';
    let endIso = '';

    if (todoElDia) {
      startIso = `${startDate}T00:00:00`;
      endIso = `${endDate}T23:59:59`;
    } else {
      startIso = `${startDate}T${startTime}:00`;
      endIso = `${endDate}T${endTime}:00`;
    }

    const payload = {
      nombre,
      descripcion,
      color,
      start: startIso,
      end: endIso,
      todoElDia,
      recordatorio,
    };

    try {
      const url = isEditing ? `/api/calendar/events/${activeEventId}` : '/api/calendar/events';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      showToast('ok', isEditing ? '✅ Evento actualizado con éxito.' : '✅ Evento creado con éxito.');
      setShowModal(false);
      fetchEventos();
    } catch {
      showToast('err', 'Ocurrió un error al guardar el evento.');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const handleDelete = async () => {
    if (!activeEventId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/calendar/events/${activeEventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();

      showToast('ok', '🗑️ Evento eliminado con éxito.');
      setShowModal(false);
      fetchEventos();
    } catch {
      showToast('err', 'Ocurrió un error al eliminar el evento.');
    } finally {
      setDeleting(false);
    }
  };

  const getEventsForDay = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return eventos.filter((evt) => {
      const evtStartStr = evt.start.split('T')[0];
      return evtStartStr === dStr;
    });
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
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur transition-all duration-300 ${
            toast.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
              : 'border-red-500/30 bg-red-500/20 text-red-300'
          }`}
        >
          {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Calendario de Actividades</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sincronizado en tiempo real con Google Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition shadow-sm dark:shadow-none"
          >
            Hoy
          </button>
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-0.5 shadow-sm dark:shadow-none">
            <button
              onClick={handlePrevMonth}
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
                  if (year && month) {
                    const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                    setCurrentDate(newDate);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                title="Seleccionar mes y año"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold select-none text-zinc-700 dark:text-zinc-200">
                <Calendar className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-white transition-colors" />
                <span>{MESES[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              </div>
            </div>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de no sincronizado */}
      {errorGoogle && isAdmin && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-300 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              <strong>Google Calendar no está conectado.</strong> Para poder ver, organizar y sincronizar tus actividades, necesitás vincular tu cuenta de Google.
            </span>
          </div>
          <div>
            <button
              onClick={() => signIn('google', { callbackUrl: window.location.href })}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 transition shadow-md shadow-amber-900/30"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Vincular Google Calendar
            </button>
          </div>
        </div>
      )}

      {/* Grilla de calendario */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0c0c14]/40 overflow-hidden shadow-2xl transition-colors duration-200">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03]">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {d}
            </div>
          ))}
        </div>

        {/* Días */}
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
                  onClick={() => handleOpenCreate(cell.date)}
                  className={`min-h-[100px] border-r border-b border-zinc-100 dark:border-white/5 p-2 transition hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] cursor-pointer flex flex-col gap-1 relative ${
                    cell.isCurrentMonth ? 'text-zinc-800 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {/* Número de día */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center text-xs font-semibold rounded-full ${
                        isToday(cell.date)
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                          : ''
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                  </div>

                  {/* Lista de eventos del día */}
                  <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map((evt) => {
                      const colorStyle = COLORS.find((c) => c.name === evt.color) || COLORS[0];
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => handleOpenEdit(evt, e)}
                          className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-0.5 text-[10px] font-medium leading-normal ${colorStyle.bg} transition hover:brightness-110`}
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

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl overflow-hidden flex flex-col">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">
                  {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Título */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400 uppercase">Título del Evento</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Reunión de Diseño con Keranai"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
                />
              </div>

              {/* Fechas y Horas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-400 uppercase">Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
                {!todoElDia && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-400 uppercase">Hora Inicio</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-400 uppercase">Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>
                {!todoElDia && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-400 uppercase">Hora Fin</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 py-2 border-y border-white/5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={todoElDia}
                    onChange={(e) => setTodoElDia(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-violet-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  />
                  Todo el día
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={recordatorio}
                    onChange={(e) => setRecordatorio(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-violet-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  />
                  Recordatorio (30m antes)
                </label>
              </div>

              {/* Color Picker */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400 uppercase">Color de Categoría</label>
                <div className="flex gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      className={`h-7 w-7 rounded-full border-2 transition ${c.dot} ${
                        color === c.name ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-400 uppercase">Descripción / Notas</label>
                <textarea
                  placeholder="Detalles sobre la actividad..."
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 resize-none"
                />
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Eliminar
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isEditing ? 'Guardar Cambios' : 'Crear Evento'}
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
