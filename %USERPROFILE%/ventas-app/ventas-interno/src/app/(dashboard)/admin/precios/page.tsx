'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download,
  Upload,
  Plus,
  Trash2,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface PrecioItem {
  id: string;
  lista: string;
  nombre: string;
  precio: number;
  moneda: string;
  cantidad: number | null;
  costoGs: number | null;
  costoUsd: number | null;
  lugar: string | null;
  agotado: boolean;
  pendiente: string | null;
  orden: number;
}

const LISTAS = [
  { value: 'PRODUCTOS', label: 'Productos · KERANAI PRODUCTOS' },
  { value: 'SERVICIOS', label: 'Servicios · KERANAI AGENCIA DISEÑO DIGITAL' },
];

/** Formatea número como guaraní paraguayo: ₲ 14.000 */
function formatPYG(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return '₲ ' + Math.round(Number(n)).toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatUSD(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return 'USD ' + Number(n).toFixed(2);
}

function coerce(field: string, raw: string): any {
  if (['precio', 'cantidad', 'costoGs', 'costoUsd'].includes(field)) {
    return raw.trim() === '' ? null : Number(raw.replace(/\./g, '').replace(',', '.'));
  }
  if (field === 'agotado') return raw === 'true' || raw === '1';
  return raw;
}

export default function PreciosPage() {
  const [lista, setLista] = useState('PRODUCTOS');
  const [items, setItems] = useState<PrecioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  // Estado de edición con refs para evitar stale closures al guardar en onBlur
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editingCellRef = useRef<{ id: string; field: string } | null>(null);
  const editValueRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/precios?lista=${lista}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast('err', 'Error al cargar la lista.');
    } finally {
      setLoading(false);
    }
  }, [lista]);

  useEffect(() => {
    fetchItems();
    // Cancelar edición al cambiar de lista
    editingCellRef.current = null;
    setEditingCell(null);
  }, [fetchItems]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const startEdit = (id: string, field: string, value: any) => {
    const strVal = value == null ? '' : String(value);
    editingCellRef.current = { id, field };
    editValueRef.current = strVal;
    setEditingCell({ id, field });
    setEditValue(strVal);
  };

  const handleValueChange = (val: string) => {
    editValueRef.current = val;
    setEditValue(val);
  };

  // Guarda usando refs → inmune a stale closures
  const commitSave = useCallback(async () => {
    const cell = editingCellRef.current;
    const raw = editValueRef.current;
    if (!cell) return;

    editingCellRef.current = null;
    setEditingCell(null);

    const { id, field } = cell;
    const newValue = coerce(field, raw);

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: newValue } : it))
    );

    setSaving(id);
    try {
      const res = await fetch(`/api/precios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      showToast('err', 'Error al guardar el cambio.');
      fetchItems();
    } finally {
      setSaving(null);
    }
  }, [fetchItems]);

  const cancelEdit = () => {
    editingCellRef.current = null;
    setEditingCell(null);
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await fetch(`/api/precios/${id}`, { method: 'DELETE' });
    } catch {
      showToast('err', 'Error al eliminar.');
      fetchItems();
    }
  };

  const addRow = async () => {
    try {
      const res = await fetch('/api/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lista, nombre: 'Nuevo ítem', precio: 0, moneda: 'PYG' }),
      });
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      setTimeout(() => startEdit(newItem.id, 'nombre', 'Nuevo ítem'), 80);
    } catch {
      showToast('err', 'Error al agregar fila.');
    }
  };

  const handleImport = async () => {
    setShowImportConfirm(false);
    setImporting(true);
    try {
      const res = await fetch(`/api/precios/import?lista=${lista}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      showToast('ok', `✅ ${data.importados} ítems importados desde Excel.`);
      fetchItems();
    } catch (e: any) {
      showToast('err', `Error al importar: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    window.location.href = `/api/precios/export?lista=${lista}`;
  };

  const toggleAgotado = async (item: PrecioItem) => {
    const newVal = !item.agotado;
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, agotado: newVal } : it)));
    await fetch(`/api/precios/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agotado: newVal }),
    });
  };

  const isProductos = lista === 'PRODUCTOS';

  // Celda editable inline
  const Cell = ({
    item,
    field,
    display,
    align = 'left',
    numeric = false,
  }: {
    item: PrecioItem;
    field: string;
    display: string;
    align?: 'left' | 'right' | 'center';
    numeric?: boolean;
  }) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type={numeric ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={commitSave}           // ← guarda siempre al salir
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.currentTarget.blur(); }  // blur dispara commitSave
            if (e.key === 'Escape') cancelEdit();
          }}
          className={`w-full bg-violet-900/40 border border-violet-500 rounded px-2 py-1 text-sm text-white outline-none text-${align} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
      );
    }

    return (
      <span
        onClick={() => startEdit(item.id, field, (item as any)[field])}
        className={`block cursor-pointer select-none rounded px-2 py-1 text-sm transition-all hover:bg-white/10 text-${align} ${
          display === '—' ? 'text-zinc-600' : 'text-white'
        }`}
        title="Clic para editar"
      >
        {display}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6 text-white">
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

      {/* Modal confirm reimport */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-semibold">Reimportar desde Excel</h3>
            </div>
            <p className="mb-6 text-sm text-zinc-400">
              Esta acción <strong className="text-white">borrará todos los ítems actuales</strong> de{' '}
              <span className="text-violet-400">{LISTAS.find((l) => l.value === lista)?.label}</span>{' '}
              y los reemplazará con el archivo Excel original en{' '}
              <code className="text-xs text-zinc-300">D:\TRABAJOS\AGENCIA K\KERANAI\PRESUPUESTOS\</code>.
              <br /><br />¿Estás seguro?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportConfirm(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
              >
                Sí, reimportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lista de Precios</h1>
            <p className="text-sm text-zinc-400">
              Clic en cualquier celda para editar · Enter o Tab para guardar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition"
            >
              <span className="max-w-[200px] truncate">
                {LISTAS.find((l) => l.value === lista)?.label}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-white/10 bg-[#0f0f1a] shadow-2xl">
                {LISTAS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setLista(l.value); setDropdownOpen(false); }}
                    className={`flex w-full items-center px-4 py-3 text-sm transition hover:bg-white/5 ${
                      lista === l.value ? 'text-violet-400 font-semibold' : 'text-zinc-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Importar */}
          <button
            onClick={() => setShowImportConfirm(true)}
            disabled={importing}
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Excel
          </button>

          {/* Exportar */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Download className="h-4 w-4" />
            Descargar .xlsx
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="w-10 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">#</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {isProductos ? 'Artículo' : 'Servicio'}
                  </th>
                  {isProductos ? (
                    <>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Cant.</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Lugar</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Costo Gs.</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Costo USD.</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Precio Venta</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Estado</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Pendiente</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Cant.</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Costo Gs.</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Precio Venta</th>
                    </>
                  )}
                  <th className="w-10 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isProductos ? 9 : 7}
                      className="py-16 text-center text-zinc-500"
                    >
                      No hay ítems. Importá desde Excel o agregá uno manualmente.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-white/5 transition hover:bg-white/[0.02] ${
                        saving === item.id ? 'opacity-60' : ''
                      } ${item.agotado && isProductos ? 'bg-red-900/10' : ''}`}
                    >
                      <td className="px-3 py-2 text-center text-xs text-zinc-600">{idx + 1}</td>

                      {/* Nombre */}
                      <td className="px-3 py-2 min-w-[220px]">
                        <Cell item={item} field="nombre" display={item.nombre || '—'} />
                      </td>

                      {isProductos ? (
                        <>
                          <td className="px-3 py-2 min-w-[70px]">
                            <Cell item={item} field="cantidad" display={item.cantidad != null ? String(item.cantidad) : '—'} align="right" numeric />
                          </td>
                          <td className="px-3 py-2 min-w-[120px]">
                            <Cell item={item} field="lugar" display={item.lugar || '—'} />
                          </td>
                          <td className="px-3 py-2 min-w-[130px]">
                            <Cell item={item} field="costoGs" display={formatPYG(item.costoGs)} align="right" numeric />
                          </td>
                          <td className="px-3 py-2 min-w-[110px]">
                            <Cell item={item} field="costoUsd" display={formatUSD(item.costoUsd)} align="right" numeric />
                          </td>
                          <td className="px-3 py-2 min-w-[140px]">
                            <Cell item={item} field="precio" display={formatPYG(item.precio)} align="right" numeric />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => toggleAgotado(item)}
                              className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                                item.agotado
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {item.agotado ? 'AGOTADO' : 'En Stock'}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 min-w-[140px]">
                            <Cell item={item} field="pendiente" display={item.pendiente || '—'} />
                          </td>
                          <td className="px-3 py-2 min-w-[70px]">
                            <Cell item={item} field="cantidad" display={item.cantidad != null ? String(item.cantidad) : '—'} align="right" numeric />
                          </td>
                          <td className="px-3 py-2 min-w-[130px]">
                            <Cell item={item} field="costoGs" display={formatPYG(item.costoGs)} align="right" numeric />
                          </td>
                          <td className="px-3 py-2 min-w-[140px]">
                            <Cell item={item} field="precio" display={formatPYG(item.precio)} align="right" numeric />
                          </td>
                        </>
                      )}

                      {/* Eliminar */}
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="border-t border-white/5 px-4 py-3">
            <button
              onClick={addRow}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-violet-400"
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-zinc-600">
        {items.length} {items.length === 1 ? 'ítem' : 'ítems'} ·{' '}
        Clic para editar · Enter o Tab para guardar · Esc para cancelar
      </p>
    </div>
  );
}
