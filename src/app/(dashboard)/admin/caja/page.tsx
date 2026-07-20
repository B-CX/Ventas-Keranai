'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, ArrowDownRight, ArrowUpRight, Lock, Unlock,
  AlertCircle, Plus, Minus, History, LayoutDashboard,
  ChevronDown, ChevronUp, X, Calculator, Trash2
} from 'lucide-react';

// ─── DENOMINACIONES ──────────────────────────────────────────────────────────
const BILLETES_PYG = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];
const BILLETES_USD = [100, 50, 20, 10, 5, 1];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Formato paraguayo: 1.000.000 Gs.
const gs = (n: number) => `${Math.round(n).toLocaleString('es-PY')} Gs.`;
const usd = (n: number) => `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function difBadge(dif: number, moneda: 'pyg' | 'usd') {
  const fmt = moneda === 'pyg' ? gs : usd;
  if (Math.abs(dif) < 0.01) return <span className="text-green-400 font-bold text-sm">✓ Cuadrado</span>;
  if (dif > 0) return <span className="text-blue-400 font-bold text-sm">+{fmt(dif)} sobrante</span>;
  return <span className="text-red-400 font-bold text-sm">{fmt(dif)} faltante</span>;
}

// ─── MODAL BASE ───────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── CALCULADORA DE BILLETES ─────────────────────────────────────────────────
function CalculadoraBilletes({
  open, onClose, onConfirm
}: { open: boolean; onClose: () => void; onConfirm: (totalPyg: number, totalUsd: number) => void }) {
  const [cantPyg, setCantPyg] = useState<Record<number, string>>({});
  const [cantUsd, setCantUsd] = useState<Record<number, string>>({});

  const totalPyg = BILLETES_PYG.reduce((acc, b) => acc + (Number(cantPyg[b]) || 0) * b, 0);
  const totalUsd = BILLETES_USD.reduce((acc, b) => acc + (Number(cantUsd[b]) || 0) * b, 0);

  const reset = () => { setCantPyg({}); setCantUsd({}); };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="🧮 Calculadora de Arqueo">
      <div className="space-y-5">
        {/* GUARANÍES */}
        <div>
          <h3 className="text-sm font-semibold text-violet-400 mb-3">Guaraníes (PYG)</h3>
          <div className="space-y-2">
            {BILLETES_PYG.map(b => (
              <div key={b} className="flex items-center gap-3">
                <span className="text-sm text-zinc-300 w-28 text-right">{b.toLocaleString('es-PY')} Gs.</span>
                <input
                  type="number" min="0"
                  value={cantPyg[b] || ''}
                  onChange={e => setCantPyg(p => ({ ...p, [b]: e.target.value }))}
                  placeholder="0"
                  className="w-20 bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <span className="text-xs text-zinc-500 flex-1">
                  = {((Number(cantPyg[b]) || 0) * b).toLocaleString('es-PY')} Gs.
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2">
            <span className="text-sm text-zinc-300">Total Guaraníes</span>
            <span className="text-lg font-bold text-violet-300">{gs(totalPyg)}</span>
          </div>
        </div>

        {/* DÓLARES */}
        <div>
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">Dólares (USD)</h3>
          <div className="space-y-2">
            {BILLETES_USD.map(b => (
              <div key={b} className="flex items-center gap-3">
                <span className="text-sm text-zinc-300 w-28 text-right">$ {b}</span>
                <input
                  type="number" min="0"
                  value={cantUsd[b] || ''}
                  onChange={e => setCantUsd(p => ({ ...p, [b]: e.target.value }))}
                  placeholder="0"
                  className="w-20 bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs text-zinc-500 flex-1">
                  = $ {((Number(cantUsd[b]) || 0) * b).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
            <span className="text-sm text-zinc-300">Total Dólares</span>
            <span className="text-lg font-bold text-emerald-300">{usd(totalUsd)}</span>
          </div>
        </div>

        <button
          onClick={() => { onConfirm(totalPyg, totalUsd); reset(); onClose(); }}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold transition-colors"
        >
          Usar estos montos para el cierre
        </button>
      </div>
    </Modal>
  );
}

// ─── MODAL MOVIMIENTO MANUAL ──────────────────────────────────────────────────
function ModalMovimiento({
  open, tipo, cajaId, onClose, onSuccess
}: { open: boolean; tipo: 'INGRESO' | 'EGRESO'; cajaId: string; onClose: () => void; onSuccess: () => void }) {
  const [moneda, setMoneda] = useState<'PYG' | 'USD'>('PYG');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/caja/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cajaId, tipo, moneda, monto: Number(monto), descripcion }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error'); }
      setMonto(''); setDescripcion('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tipo === 'INGRESO' ? '➕ Ingreso Manual' : '➖ Retiro Manual'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>}
        <div className="flex gap-2">
          {(['PYG', 'USD'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMoneda(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${moneda === m ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
              {m === 'PYG' ? '🇵🇾 Guaraníes' : '🇺🇸 Dólares'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">{moneda === 'PYG' ? '₲' : '$'}</span>
            {moneda === 'PYG' ? (
              <input
                type="text"
                inputMode="numeric"
                required
                value={monto}
                onChange={e => { if (/^\d*$/.test(e.target.value)) setMonto(e.target.value); }}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="15000" />
            ) : (
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="0.00" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Concepto</label>
          <input type="text" required value={descripcion} onChange={e => setDescripcion(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder={tipo === 'INGRESO' ? 'Ej: Monedas para vuelto' : 'Ej: Pago delivery'} />
        </div>
        <button type="submit" disabled={loading}
          className={`w-full rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-50 ${tipo === 'INGRESO' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
          {loading ? 'Guardando...' : tipo === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Retiro'}
        </button>
      </form>
    </Modal>
  );
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
function HistorialTab() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistorial = () => {
    fetch('/api/caja/historial').then(r => r.json()).then(d => {
      setHistorial(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchHistorial(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de caja cerrada? Las operaciones relacionadas (Ventas, Gastos) NO se borrarán, pero quedarán huérfanas de este cierre.')) return;
    
    try {
      const res = await fetch(`/api/caja/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistorial();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'No se pudo eliminar'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al intentar eliminar.');
    }
  };

  if (loading) return <div className="text-center text-zinc-400 py-12">Cargando historial...</div>;
  if (historial.length === 0) return (
    <div className="text-center py-12">
      <History className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
      <p className="text-zinc-400">No hay cierres de caja registrados aún.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {historial.map((c: any) => {
        const difPyg = c.diferencia ?? 0;
        const difUsd = c.diferenciaUsd ?? 0;
        const isOpen = expanded === c.id;
        const fecha = new Date(c.fechaCierre);

        return (
          <div key={c.id} className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(isOpen ? null : c.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">🔒</div>
                <div>
                  <p className="text-white font-semibold">
                    {fecha.toLocaleDateString('es-PY', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                  <p className="text-zinc-500 text-xs">Cerrado por {c.usuario?.name ?? 'usuario'} · {fecha.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-zinc-500">Efectivo Real</p>
                  <p className="text-white font-bold">{gs(c.saldoFinal ?? 0)}</p>
                  <p className="text-zinc-400 text-xs">{usd(c.saldoFinalUsd ?? 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Diferencia</p>
                  {difBadge(difPyg, 'pyg')}
                  <br />
                  {difBadge(difUsd, 'usd')}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-white/10 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Saldo Inicial ₲</p>
                  <p className="text-white font-bold">{gs(c.saldoInicial)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Saldo Inicial $</p>
                  <p className="text-white font-bold">{usd(c.saldoInicialUsd)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Ventas Efectivo ₲</p>
                  <p className="text-white font-bold">
                    {gs(c.ventas.filter((v: any) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'PYG' && v.estado === 'COMPLETADA').reduce((a: number, v: any) => a + v.total, 0))}
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Ventas Efectivo $</p>
                  <p className="text-white font-bold">
                    {usd(c.ventas.filter((v: any) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'USD' && v.estado === 'COMPLETADA').reduce((a: number, v: any) => a + (v.total / (v.cotizacionUsd || 7500)), 0))}
                  </p>
                </div>
                {c.notas && (
                  <div className="col-span-2 sm:col-span-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-xs text-amber-400 font-semibold mb-1">Notas de cierre</p>
                    <p className="text-zinc-200 text-sm">{c.notas}</p>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-4 mt-2 flex justify-end border-t border-white/5 pt-4">
                  <button onClick={() => handleDelete(c.id)} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar Cierre de Caja
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function CajaPage() {
  const [tab, setTab] = useState<'caja' | 'historial'>('caja');
  const [caja, setCaja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apertura
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoInicialUsd, setSaldoInicialUsd] = useState('');

  // Cierre
  const [saldoFinal, setSaldoFinal] = useState('');
  const [saldoFinalUsd, setSaldoFinalUsd] = useState('');
  const [notas, setNotas] = useState('');

  // Modales
  const [modalIngreso, setModalIngreso] = useState(false);
  const [modalRetiro, setModalRetiro] = useState(false);
  const [modalArqueo, setModalArqueo] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCaja = useCallback(async () => {
    try {
      const res = await fetch('/api/caja');
      if (res.ok) { const data = await res.json(); setCaja(data); }
      else setCaja(null);
    } catch { setCaja(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCaja(); }, [fetchCaja]);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError('');
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saldoInicial: Number(saldoInicial) || 0, saldoInicialUsd: Number(saldoInicialUsd) || 0 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al abrir caja'); }
      setSaldoInicial(''); setSaldoInicialUsd('');
      fetchCaja();
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError('');
    try {
      const res = await fetch('/api/caja', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cajaId: caja.id, saldoFinal: Number(saldoFinal) || 0, saldoFinalUsd: Number(saldoFinalUsd) || 0, notas }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al cerrar caja'); }
      setSaldoFinal(''); setSaldoFinalUsd(''); setNotas('');
      fetchCaja();
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  // ── Cálculos en tiempo real ──
  let ingresosPyg = 0, egresosPyg = 0, saldoTeoricoPyg = 0;
  let ingresosUsd = 0, egresosUsd = 0, saldoTeoricoUsd = 0;

  if (caja && caja.estado === 'ABIERTA') {
    ingresosPyg = caja.ventas.filter((v: any) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'PYG' && v.estado === 'COMPLETADA').reduce((a: number, v: any) => a + v.total, 0)
      + (caja.movimientos?.filter((m: any) => m.tipo === 'INGRESO' && m.moneda === 'PYG').reduce((a: number, m: any) => a + m.monto, 0) || 0);
    egresosPyg = (caja.gastos?.filter((g: any) => g.moneda === 'PYG').reduce((a: number, g: any) => a + g.monto, 0) || 0)
      + (caja.compras?.filter((c: any) => c.moneda === 'PYG').reduce((a: number, c: any) => a + c.total, 0) || 0)
      + (caja.movimientos?.filter((m: any) => m.tipo === 'EGRESO' && m.moneda === 'PYG').reduce((a: number, m: any) => a + m.monto, 0) || 0);
    saldoTeoricoPyg = caja.saldoInicial + ingresosPyg - egresosPyg;

    ingresosUsd = caja.ventas.filter((v: any) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'USD' && v.estado === 'COMPLETADA').reduce((a: number, v: any) => a + (v.total / (v.cotizacionUsd || 7500)), 0)
      + (caja.movimientos?.filter((m: any) => m.tipo === 'INGRESO' && m.moneda === 'USD').reduce((a: number, m: any) => a + m.monto, 0) || 0);
    egresosUsd = (caja.gastos?.filter((g: any) => g.moneda === 'USD').reduce((a: number, g: any) => a + g.monto, 0) || 0)
      + (caja.compras?.filter((c: any) => c.moneda === 'USD').reduce((a: number, c: any) => a + c.total, 0) || 0)
      + (caja.movimientos?.filter((m: any) => m.tipo === 'EGRESO' && m.moneda === 'USD').reduce((a: number, m: any) => a + m.monto, 0) || 0);
    saldoTeoricoUsd = caja.saldoInicialUsd + ingresosUsd - egresosUsd;
  }

  const difPyg = Number(saldoFinal) - saldoTeoricoPyg;
  const difUsd = Number(saldoFinalUsd) - saldoTeoricoUsd;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Control de Caja</h1>
          <p className="text-zinc-400 mt-1">Sistema de apertura y cierre de turno bimonetario</p>
        </div>
        {/* TABS */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button onClick={() => setTab('caja')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'caja' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
            <LayoutDashboard className="w-4 h-4" /> Caja Actual
          </button>
          <button onClick={() => setTab('historial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'historial' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
            <History className="w-4 h-4" /> Historial
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ─── TAB: HISTORIAL ─── */}
      {tab === 'historial' && <HistorialTab />}

      {/* ─── TAB: CAJA ACTUAL ─── */}
      {tab === 'caja' && (
        <>
          {/* APERTURA */}
          {(!caja || caja.estado === 'CERRADA') && (
            <div className="glass-panel border border-white/10 rounded-2xl p-8 max-w-lg mx-auto mt-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <Unlock className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white text-center mb-1">Apertura de Turno</h2>
              <p className="text-zinc-400 text-sm text-center mb-8">Ingresa el dinero en efectivo con el que empiezas el turno.</p>

              <form onSubmit={handleAbrirCaja} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Guaraníes (PYG)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₲</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={saldoInicial}
                        onChange={e => { if (/^\d*$/.test(e.target.value)) setSaldoInicial(e.target.value); }}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="50000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Dólares (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input type="number" required min="0" step="0.01" value={saldoInicialUsd} onChange={e => setSaldoInicialUsd(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="0.00" />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Abriendo...' : '🔓 Abrir Caja'}
                </button>
              </form>
            </div>
          )}

          {/* CAJA ABIERTA */}
          {caja && caja.estado === 'ABIERTA' && (
            <div className="space-y-6">
              {/* BADGE ESTADO */}
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-sm font-medium">
                  Caja abierta desde las {new Date(caja.fechaApertura).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })} por {caja.usuario?.name ?? 'usuario'}
                </span>
              </div>

              {/* PANELES PYG + USD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* GUARANÍES */}
                <div className="glass-panel border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇵🇾</span>
                      <div>
                        <p className="text-xs text-blue-300 font-semibold tracking-wide uppercase">Guaraníes</p>
                        <p className="text-xs text-zinc-500">PYG</p>
                      </div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-3 py-1">
                      <p className="text-xs text-blue-300 font-medium">Balance esperado</p>
                      <p className="text-xl font-bold text-blue-300 text-right">{gs(saldoTeoricoPyg)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-1">Inicial</p>
                      <p className="text-sm font-bold text-white">{gs(caja.saldoInicial)}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-3">
                      <p className="text-xs text-green-500 mb-1 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />Ingresos</p>
                      <p className="text-sm font-bold text-green-400">+{gs(ingresosPyg)}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-3">
                      <p className="text-xs text-red-500 mb-1 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />Egresos</p>
                      <p className="text-sm font-bold text-red-400">-{gs(egresosPyg)}</p>
                    </div>
                  </div>
                </div>

                {/* DÓLARES */}
                <div className="glass-panel border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇺🇸</span>
                      <div>
                        <p className="text-xs text-emerald-300 font-semibold tracking-wide uppercase">Dólares</p>
                        <p className="text-xs text-zinc-500">USD</p>
                      </div>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-3 py-1">
                      <p className="text-xs text-emerald-300 font-medium">Balance esperado</p>
                      <p className="text-xl font-bold text-emerald-300 text-right">{usd(saldoTeoricoUsd)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-1">Inicial</p>
                      <p className="text-sm font-bold text-white">{usd(caja.saldoInicialUsd)}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-3">
                      <p className="text-xs text-green-500 mb-1 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />Ingresos</p>
                      <p className="text-sm font-bold text-green-400">+{usd(ingresosUsd)}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-3">
                      <p className="text-xs text-red-500 mb-1 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />Egresos</p>
                      <p className="text-sm font-bold text-red-400">-{usd(egresosUsd)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTONES RÁPIDOS */}
              <div className="flex gap-3">
                <button onClick={() => setModalIngreso(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 rounded-xl py-3 font-semibold transition-colors">
                  <Plus className="w-5 h-5" /> Ingreso Manual
                </button>
                <button onClick={() => setModalRetiro(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-xl py-3 font-semibold transition-colors">
                  <Minus className="w-5 h-5" /> Retiro Manual
                </button>
              </div>

              {/* MOVIMIENTOS RECIENTES */}
              {caja.movimientos?.length > 0 && (
                <div className="glass-panel border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Movimientos Manuales del Turno</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {caja.movimientos.map((m: any) => (
                      <div key={m.id} className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${m.tipo === 'INGRESO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {m.tipo === 'INGRESO' ? '+' : '-'}
                          </span>
                          <span className="text-zinc-300">{m.descripcion}</span>
                        </div>
                        <span className={`font-semibold ${m.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
                          {m.tipo === 'EGRESO' ? '-' : '+'}{m.moneda === 'PYG' ? gs(m.monto) : usd(m.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CIERRE DE TURNO */}
              <div className="glass-panel border border-red-500/20 p-8 rounded-2xl max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" /> Cierre de Turno
                </h3>
                <p className="text-zinc-400 text-sm mb-6">Cuenta el efectivo físico e ingrésalo aquí. Usa la calculadora de billetes para facilitar el conteo.</p>

                <button type="button" onClick={() => setModalArqueo(true)}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-xl py-3 font-semibold transition-colors mb-6">
                  <Calculator className="w-5 h-5" /> Abrir Calculadora de Billetes
                </button>

                <form onSubmit={handleCerrarCaja} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">Efectivo Real (Guaraníes)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₲</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={saldoFinal}
                          onChange={e => { if (/^\d*$/.test(e.target.value)) setSaldoFinal(e.target.value); }}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="150000" />
                      </div>
                      {saldoFinal && (
                        <p className={`text-xs mt-1.5 font-medium ${difPyg === 0 ? 'text-green-400' : difPyg < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {difBadge(difPyg, 'pyg')}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">Efectivo Real (Dólares)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                        <input type="number" required min="0" step="0.01" value={saldoFinalUsd} onChange={e => setSaldoFinalUsd(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="0.00" />
                      </div>
                      {saldoFinalUsd && (
                        <p className={`text-xs mt-1.5 font-medium ${difUsd === 0 ? 'text-green-400' : difUsd < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {difBadge(difUsd, 'usd')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Notas de Cierre <span className="text-zinc-500">(Opcional)</span></label>
                    <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ej. Sobran $10 de vuelto" />
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 mt-2">
                    {isSubmitting ? 'Cerrando...' : '🔒 Realizar Cierre de Caja'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MODALES */}
          <ModalMovimiento open={modalIngreso} tipo="INGRESO" cajaId={caja?.id ?? ''} onClose={() => setModalIngreso(false)} onSuccess={fetchCaja} />
          <ModalMovimiento open={modalRetiro} tipo="EGRESO" cajaId={caja?.id ?? ''} onClose={() => setModalRetiro(false)} onSuccess={fetchCaja} />
          <CalculadoraBilletes
            open={modalArqueo}
            onClose={() => setModalArqueo(false)}
            onConfirm={(totalPyg, totalUsd) => {
              setSaldoFinal(String(totalPyg));
              setSaldoFinalUsd(String(totalUsd));
            }}
          />
        </>
      )}
    </div>
  );
}
