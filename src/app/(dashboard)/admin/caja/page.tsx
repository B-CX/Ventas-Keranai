'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calculator,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

export default function CajaPage() {
  const router = useRouter();
  const [caja, setCaja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States para apertura y cierre
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoInicialUsd, setSaldoInicialUsd] = useState('');
  const [saldoFinal, setSaldoFinal] = useState('');
  const [saldoFinalUsd, setSaldoFinalUsd] = useState('');
  const [notas, setNotas] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCaja = async () => {
    try {
      const res = await fetch('/api/caja');
      if (res.ok) {
        const data = await res.json();
        setCaja(data);
      } else {
        setCaja(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaja();
  }, []);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          saldoInicial: Number(saldoInicial) || 0,
          saldoInicialUsd: Number(saldoInicialUsd) || 0
        })
      });
      
      if (!res.ok) throw new Error('Error al abrir caja');
      
      setSaldoInicial('');
      setSaldoInicialUsd('');
      fetchCaja();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/caja', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cajaId: caja.id, 
          saldoFinal: Number(saldoFinal) || 0,
          saldoFinalUsd: Number(saldoFinalUsd) || 0,
          notas 
        })
      });
      
      if (!res.ok) throw new Error('Error al cerrar caja');
      
      setSaldoFinal('');
      setSaldoFinalUsd('');
      setNotas('');
      fetchCaja();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;

  // Cálculos en tiempo real
  let ingresosPyg = 0;
  let egresosPyg = 0;
  let saldoTeoricoPyg = 0;

  let ingresosUsd = 0;
  let egresosUsd = 0;
  let saldoTeoricoUsd = 0;

  if (caja && caja.estado === 'ABIERTA') {
    // PYG
    ingresosPyg += caja.ventas
      .filter((v: any) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'PYG' && v.estado === 'COMPLETADA')
      .reduce((acc: number, v: any) => acc + v.total, 0);
    ingresosPyg += caja.movimientos?.filter((m:any) => m.tipo === 'INGRESO' && m.moneda === 'PYG').reduce((a:number, m:any) => a + m.monto, 0) || 0;
      
    egresosPyg += caja.gastos?.filter((g:any) => g.moneda === 'PYG').reduce((acc: number, g: any) => acc + g.monto, 0) || 0;
    egresosPyg += caja.compras?.filter((c:any) => c.moneda === 'PYG').reduce((acc: number, c: any) => acc + c.total, 0) || 0;
    egresosPyg += caja.movimientos?.filter((m:any) => m.tipo === 'EGRESO' && m.moneda === 'PYG').reduce((a:number, m:any) => a + m.monto, 0) || 0;
    
    saldoTeoricoPyg = caja.saldoInicial + ingresosPyg - egresosPyg;

    // USD
    ingresosUsd += caja.ventas
      .filter((v: any) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'USD' && v.estado === 'COMPLETADA')
      .reduce((acc: number, v: any) => acc + (v.total / (v.cotizacionUsd || 7500)), 0);
    ingresosUsd += caja.movimientos?.filter((m:any) => m.tipo === 'INGRESO' && m.moneda === 'USD').reduce((a:number, m:any) => a + m.monto, 0) || 0;
      
    egresosUsd += caja.gastos?.filter((g:any) => g.moneda === 'USD').reduce((acc: number, g: any) => acc + g.monto, 0) || 0;
    egresosUsd += caja.compras?.filter((c:any) => c.moneda === 'USD').reduce((acc: number, c: any) => acc + c.total, 0) || 0;
    egresosUsd += caja.movimientos?.filter((m:any) => m.tipo === 'EGRESO' && m.moneda === 'USD').reduce((a:number, m:any) => a + m.monto, 0) || 0;
    
    saldoTeoricoUsd = caja.saldoInicialUsd + ingresosUsd - egresosUsd;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Control de Caja (Bimonetaria)</h1>
        <p className="text-zinc-400">Gestiona las aperturas y cierres físicos de Guaraníes y Dólares.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {!caja || caja.estado === 'CERRADA' ? (
        // UI PARA ABRIR CAJA
        <div className="glass-panel border border-white/10 rounded-2xl p-8 max-w-lg mx-auto mt-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
              <Unlock className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">Apertura de Turno</h2>
          <p className="text-zinc-400 text-sm text-center mb-8">Ingresa el dinero en efectivo con el que empiezas el día en ambas monedas.</p>
          
          <form onSubmit={handleAbrirCaja} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Guaraníes (PYG)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₲</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={saldoInicial}
                    onChange={e => setSaldoInicial(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Dólares (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={saldoInicialUsd}
                    onChange={e => setSaldoInicialUsd(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </form>
        </div>
      ) : (
        // UI CAJA ABIERTA
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PANEL GUARANÍES */}
            <div className="glass-panel border border-blue-500/20 bg-blue-500/5 p-6 rounded-2xl space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                🇵🇾 Guaraníes (PYG)
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Saldo Inicial</p>
                  <p className="text-lg font-bold text-white mt-1">₲ {caja.saldoInicial.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-green-400"/> Ingresos</p>
                  <p className="text-lg font-bold text-green-400 mt-1">+₲ {ingresosPyg.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-red-400"/> Egresos</p>
                  <p className="text-lg font-bold text-red-400 mt-1">-₲ {egresosPyg.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 p-4 rounded-xl mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-400">Balance Esperado</span>
                <span className="text-2xl font-bold text-blue-400">₲ {saldoTeoricoPyg.toLocaleString()}</span>
              </div>
            </div>

            {/* PANEL DÓLARES */}
            <div className="glass-panel border border-emerald-500/20 bg-emerald-500/5 p-6 rounded-2xl space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                🇺🇸 Dólares (USD)
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Saldo Inicial</p>
                  <p className="text-lg font-bold text-white mt-1">$ {caja.saldoInicialUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-green-400"/> Ingresos</p>
                  <p className="text-lg font-bold text-green-400 mt-1">+$ {ingresosUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-1"><ArrowDownRight className="w-3 h-3 text-red-400"/> Egresos</p>
                  <p className="text-lg font-bold text-red-400 mt-1">-$ {egresosUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</p>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 p-4 rounded-xl mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-400">Balance Esperado</span>
                <span className="text-2xl font-bold text-emerald-400">$ {saldoTeoricoUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
              </div>
            </div>

          </div>

          {/* CIERRE DE TURNO */}
          <div className="glass-panel border border-red-500/20 p-8 rounded-2xl max-w-2xl mx-auto mt-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" /> Cierre de Turno
            </h3>
            
            <form onSubmit={handleCerrarCaja} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Efectivo Real (Guaraníes)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₲</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={saldoFinal}
                      onChange={e => setSaldoFinal(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="0"
                    />
                  </div>
                  {saldoFinal && (
                    <p className={`text-xs mt-2 font-medium ${
                      Number(saldoFinal) - saldoTeoricoPyg === 0 ? 'text-green-400' :
                      Number(saldoFinal) - saldoTeoricoPyg < 0 ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      Dif: ₲ {(Number(saldoFinal) - saldoTeoricoPyg).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Efectivo Real (Dólares)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={saldoFinalUsd}
                      onChange={e => setSaldoFinalUsd(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="0.00"
                    />
                  </div>
                  {saldoFinalUsd && (
                    <p className={`text-xs mt-2 font-medium ${
                      Number(saldoFinalUsd) - saldoTeoricoUsd === 0 ? 'text-green-400' :
                      Number(saldoFinalUsd) - saldoTeoricoUsd < 0 ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      Dif: $ {(Number(saldoFinalUsd) - saldoTeoricoUsd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Notas de Cierre (Opcional)</label>
                <input
                  type="text"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ej. Sobran $10 de vuelto"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Cerrando...' : 'Realizar Cierre de Caja'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
