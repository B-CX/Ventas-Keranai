'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';

export default function ConfiguracionPage() {
  const [cotizacionUsd, setCotizacionUsd] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/configuracion');
      if (res.ok) {
        const data = await res.json();
        setCotizacionUsd(data.cotizacionUsd.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar configuraciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cotizacionUsd: Number(cotizacionUsd) })
      });

      if (res.ok) {
        setSuccess('Configuración guardada correctamente.');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar.');
      }
    } catch (err) {
      setError('Error de conexión al guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-violet-400" /> Configuraciones
        </h1>
        <p className="text-zinc-400 mt-2">Administra las variables globales del sistema.</p>
      </div>

      <div className="glass-panel border border-white/10 rounded-2xl p-8 mt-8">
        <h2 className="text-xl font-bold text-white mb-6">Cotización de Monedas</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 mb-6">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Cotización del Dólar (USD)</label>
            <p className="text-xs text-zinc-500 mb-4">
              Este valor se utilizará automáticamente en el Punto de Venta cuando se seleccione pago en Dólares. 
              El ingreso a caja siempre se contabilizará en Guaraníes equivalentes.
            </p>
            <div className="relative max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₲</span>
              <input
                type="number"
                required
                min="1"
                value={cotizacionUsd}
                onChange={e => setCotizacionUsd(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Ej. 7500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-6 py-3 font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
