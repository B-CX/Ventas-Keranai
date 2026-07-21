'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Download, Upload, Plus, Trash2, FileSpreadsheet,
  ChevronDown, Loader2, AlertTriangle, CheckCircle2,
  Edit3, X, FolderOpen, Layers, PlusCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─────────────────── Types ───────────────────
interface PrecioLista {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
}

interface PrecioGrupo {
  id: string;
  listaId: string;
  nombre: string;
  orden: number;
}

interface PrecioItem {
  id: string;
  lista: string;
  listaId: string | null;
  grupoId: string | null;
  grupo?: PrecioGrupo | null;
  nombre: string;
  precio: number;
  moneda: string;
  cantidad: number | null;
  costoGs: number | null;
  costoUsd: number | null;
  lugar: string | null;
  agotado: boolean;
  pendiente: string | null;
  notas: string | null;
  orden: number;
}

// Legacy listas
const LEGACY_LISTAS: PrecioLista[] = [
  { id: '__PRODUCTOS__', nombre: 'Productos · KERANAI', tipo: 'PRODUCTOS', orden: -2 },
  { id: '__SERVICIOS__', nombre: 'Servicios · KERANAI AGENCIA', tipo: 'SERVICIOS', orden: -1 },
];

// ─────────────────── Formatters ───────────────────
function formatPYG(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return '₲\u00a0' + Math.round(Number(n)).toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function formatUSD(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return 'USD\u00a0' + Number(n).toFixed(2);
}
function coerce(field: string, raw: string): any {
  if (['precio', 'cantidad', 'costoGs', 'costoUsd'].includes(field)) {
    return raw.trim() === '' ? null : Number(raw.replace(/\./g, '').replace(',', '.'));
  }
  if (field === 'agotado') return raw === 'true' || raw === '1';
  return raw;
}

// ─────────────────── Cell Component (MUST be outside parent to prevent remount on every keystroke) ───────────────────
interface CellProps {
  item: PrecioItem;
  field: string;
  display: string;
  align?: 'left' | 'right' | 'center';
  numeric?: boolean;
  isEditing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onStartEdit: (id: string, field: string, value: any) => void;
  onValueChange: (val: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onEnter: (id: string, field: string) => void;
}

const Cell = memo(function Cell({
  item, field, display, align = 'left', numeric = false,
  isEditing, editValue, inputRef,
  onStartEdit, onValueChange, onCommit, onCancel, onEnter,
}: CellProps) {
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={numeric ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter(item.id, field);
          }
          if (e.key === 'Escape') onCancel();
        }}
        className={`w-full bg-violet-900/40 border border-violet-500 rounded px-2 py-1 text-sm text-white outline-none text-${align} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
    );
  }

  return (
    <span
      onClick={() => onStartEdit(item.id, field, (item as any)[field])}
      className={`block cursor-pointer select-none rounded px-2 py-1.5 text-sm transition-all duration-100 hover:bg-white/10 text-${align} ${display === '—' ? 'text-zinc-600' : 'text-white'}`}
      title="Clic para editar"
    >
      {display}
    </span>
  );
});

// ─────────────────── Component ───────────────────
export default function PreciosPage() {
  const [listas, setListas] = useState<PrecioLista[]>([]);
  const [listaActiva, setListaActiva] = useState<PrecioLista | null>(null);
  const [grupos, setGrupos] = useState<PrecioGrupo[]>([]);
  const [items, setItems] = useState<PrecioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Editing
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editingCellRef = useRef<{ id: string; field: string } | null>(null);
  const editValueRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Editing grupo names
  const [editingGrupo, setEditingGrupo] = useState<string | null>(null);
  const [editGrupoName, setEditGrupoName] = useState('');

  // Modals
  const [showNewLista, setShowNewLista] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newListaNombre, setNewListaNombre] = useState('');
  const [newListaTipo, setNewListaTipo] = useState('GENERICA');
  const [renameTxt, setRenameTxt] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[][] | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Toast ───
  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Fetch listas ───
  const fetchListas = useCallback(async () => {
    const res = await fetch('/api/precios/listas');
    if (res.ok) {
      const data: PrecioLista[] = await res.json();
      const all = [...LEGACY_LISTAS, ...data];
      setListas(all);
      // Set active to first if none selected
      setListaActiva(prev => {
        if (prev) {
          const found = all.find(l => l.id === prev.id);
          return found ?? all[0] ?? null;
        }
        return all[0] ?? null;
      });
    }
  }, []);

  useEffect(() => { fetchListas(); }, [fetchListas]);

  // ─── Fetch items & grupos ───
  const fetchData = useCallback(async () => {
    if (!listaActiva) return;
    setLoading(true);
    try {
      let itemsUrl: string;
      let gruposData: PrecioGrupo[] = [];

      if (listaActiva.id.startsWith('__')) {
        // Legacy
        const legacyKey = listaActiva.id === '__PRODUCTOS__' ? 'PRODUCTOS' : 'SERVICIOS';
        itemsUrl = `/api/precios?lista=${legacyKey}`;
      } else {
        itemsUrl = `/api/precios?listaId=${listaActiva.id}`;
        const gRes = await fetch(`/api/precios/grupos?listaId=${listaActiva.id}`);
        if (gRes.ok) gruposData = await gRes.json();
      }

      const [iRes] = await Promise.all([fetch(itemsUrl)]);
      if (iRes.ok) setItems(await iRes.json());
      setGrupos(gruposData);
    } catch {
      showToast('err', 'Error al cargar la lista.');
    } finally {
      setLoading(false);
    }
  }, [listaActiva]);

  useEffect(() => {
    fetchData();
    editingCellRef.current = null;
    setEditingCell(null);
  }, [fetchData]);

  // Focus on edit
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // ─── Cell editing ───
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

  const commitSave = useCallback(async () => {
    const cell = editingCellRef.current;
    const raw = editValueRef.current;
    if (!cell) return;

    editingCellRef.current = null;
    setEditingCell(null);

    const { id, field } = cell;
    const newValue = coerce(field, raw);

    setItems(prev => prev.map(it => (it.id === id ? { ...it, [field]: newValue } : it)));

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
      fetchData();
    } finally {
      setSaving(null);
    }
  }, [fetchData]);

  const cancelEdit = () => {
    editingCellRef.current = null;
    setEditingCell(null);
  };

  // Get ordered fields for Tab navigation per tipo
  const getEditableFields = (tipo: string): string[] => {
    if (tipo === 'PRODUCTOS') return ['nombre', 'cantidad', 'lugar', 'costoGs', 'costoUsd', 'precio'];
    if (tipo === 'SERVICIOS') return ['nombre', 'pendiente', 'cantidad', 'costoGs', 'precio'];
    return ['nombre', 'precio', 'notas'];
  };

  const moveToNextCell = useCallback((currentId: string, currentField: string) => {
    const tipo = listaActiva?.tipo ?? 'GENERICA';
    const fields = getEditableFields(tipo);
    const fieldIdx = fields.indexOf(currentField);
    if (fieldIdx === -1) return;

    const nextField = fields[fieldIdx + 1];
    if (nextField) {
      // Next field in same row
      const item = items.find(i => i.id === currentId);
      if (item) {
        startEdit(currentId, nextField, (item as any)[nextField]);
      }
    } else {
      // Next row, first field
      const itemIdx = items.findIndex(i => i.id === currentId);
      const nextItem = items[itemIdx + 1];
      if (nextItem) {
        startEdit(nextItem.id, fields[0], (nextItem as any)[fields[0]]);
      }
    }
  }, [items, listaActiva]);

  // ─── CRUD items ───
  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    try {
      await fetch(`/api/precios/${id}`, { method: 'DELETE' });
    } catch {
      showToast('err', 'Error al eliminar.');
      fetchData();
    }
  };

  const addRow = async (grupoId?: string) => {
    if (!listaActiva) return;
    const isLegacy = listaActiva.id.startsWith('__');
    const tipo = listaActiva.tipo;

    try {
      const payload: any = {
        nombre: 'Nuevo ítem',
        precio: 0,
        moneda: 'PYG',
      };
      if (isLegacy) {
        payload.lista = listaActiva.id === '__PRODUCTOS__' ? 'PRODUCTOS' : 'SERVICIOS';
      } else {
        payload.listaId = listaActiva.id;
        payload.lista = listaActiva.id;
        if (grupoId) payload.grupoId = grupoId;
      }

      const res = await fetch('/api/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const newItem = await res.json();
      setItems(prev => [...prev, newItem]);
      setTimeout(() => startEdit(newItem.id, 'nombre', 'Nuevo ítem'), 80);
    } catch {
      showToast('err', 'Error al agregar fila.');
    }
  };

  const toggleAgotado = async (item: PrecioItem) => {
    const newVal = !item.agotado;
    setItems(prev => prev.map(it => (it.id === item.id ? { ...it, agotado: newVal } : it)));
    await fetch(`/api/precios/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agotado: newVal }),
    });
  };

  // ─── Grupos ───
  const addGrupo = async () => {
    if (!listaActiva || listaActiva.id.startsWith('__')) return;
    const res = await fetch('/api/precios/grupos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listaId: listaActiva.id, nombre: 'Nuevo grupo' }),
    });
    if (res.ok) {
      const g = await res.json();
      setGrupos(prev => [...prev, g]);
      setEditingGrupo(g.id);
      setEditGrupoName('Nuevo grupo');
    }
  };

  const saveGrupo = async (id: string) => {
    const nombre = editGrupoName.trim();
    if (!nombre) { setEditingGrupo(null); return; }
    const res = await fetch(`/api/precios/grupos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    if (res.ok) {
      setGrupos(prev => prev.map(g => g.id === id ? { ...g, nombre } : g));
    }
    setEditingGrupo(null);
  };

  const deleteGrupo = async (id: string) => {
    if (!confirm('¿Eliminar este grupo? Los ítems quedarán sin grupo.')) return;
    await fetch(`/api/precios/grupos/${id}`, { method: 'DELETE' });
    setGrupos(prev => prev.filter(g => g.id !== id));
    setItems(prev => prev.map(it => it.grupoId === id ? { ...it, grupoId: null, grupo: null } : it));
  };

  // ─── Listas CRUD ───
  const createLista = async () => {
    if (!newListaNombre.trim()) return;
    const res = await fetch('/api/precios/listas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newListaNombre.trim(), tipo: newListaTipo }),
    });
    if (res.ok) {
      const newL: PrecioLista = await res.json();
      setShowNewLista(false);
      setNewListaNombre('');
      await fetchListas();
      setListaActiva(newL);
    } else {
      const err = await res.json();
      showToast('err', err.error || 'Error al crear la lista.');
    }
  };

  const renameLista = async () => {
    if (!listaActiva || listaActiva.id.startsWith('__') || !renameTxt.trim()) return;
    const res = await fetch(`/api/precios/listas/${listaActiva.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: renameTxt.trim() }),
    });
    if (res.ok) {
      setShowRename(false);
      await fetchListas();
    } else {
      const err = await res.json();
      showToast('err', err.error || 'Error al renombrar.');
    }
  };

  const deleteLista = async () => {
    if (!listaActiva || listaActiva.id.startsWith('__')) return;
    await fetch(`/api/precios/listas/${listaActiva.id}`, { method: 'DELETE' });
    setShowDeleteConfirm(false);
    await fetchListas();
  };

  // ─── Import Excel ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      setImportRows(rows);
      setShowImportModal(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!importRows || !listaActiva) return;
    setImporting(true);
    try {
      const listaId = listaActiva.id.startsWith('__')
        ? listaActiva.id === '__PRODUCTOS__' ? 'PRODUCTOS' : 'SERVICIOS'
        : listaActiva.id;
      const tipo = listaActiva.tipo;

      const res = await fetch('/api/precios/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listaId, tipo, rows: importRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('ok', `✅ ${data.importados} ítems importados.`);
      setShowImportModal(false);
      setImportRows(null);
      fetchData();
    } catch (e: any) {
      showToast('err', `Error: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    if (!listaActiva) return;
    const isLegacy = listaActiva.id.startsWith('__');
    const param = isLegacy
      ? `lista=${listaActiva.id === '__PRODUCTOS__' ? 'PRODUCTOS' : 'SERVICIOS'}`
      : `listaId=${listaActiva.id}`;
    window.location.href = `/api/precios/export?${param}`;
  };

  const isProductos = listaActiva?.tipo === 'PRODUCTOS';
  const isServicios = listaActiva?.tipo === 'SERVICIOS';
  const isGenerica = !isProductos && !isServicios;
  const isLegacy = listaActiva?.id.startsWith('__') ?? false;

  // Helper: is this specific cell currently being edited?
  const isCellEditing = (id: string, field: string) =>
    editingCell?.id === id && editingCell?.field === field;

  // Group items by grupoId
  const itemsByGrupo = (grupoId: string | null) =>
    items.filter(it => it.grupoId === grupoId);

  // ─── Shared Cell props factory ───
  const cellProps = (item: PrecioItem, field: string) => ({
    item,
    field,
    isEditing: isCellEditing(item.id, field),
    editValue,
    inputRef,
    onStartEdit: startEdit,
    onValueChange: handleValueChange,
    onCommit: commitSave,
    onCancel: cancelEdit,
    onEnter: (id: string, f: string) => {
      commitSave().then(() => moveToNextCell(id, f));
    },
  });

  // ─── Render table rows for a set of items ───
  const renderRows = (itemSet: PrecioItem[]) =>
    itemSet.map((item) => (
      <tr
        key={item.id}
        className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${saving === item.id ? 'opacity-60' : ''} ${item.agotado && isProductos ? 'bg-red-900/10' : ''}`}
      >
        <td className="px-3 py-2 text-center text-xs text-zinc-600">
          {saving === item.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto text-violet-400" /> : items.indexOf(item) + 1}
        </td>

        {/* Nombre */}
        <td className="px-3 py-2 min-w-[200px] max-w-[300px]">
          <Cell {...cellProps(item, 'nombre')} display={item.nombre || '—'} />
        </td>

        {isProductos && (
          <>
            <td className="px-3 py-2 min-w-[70px]">
              <Cell {...cellProps(item, 'cantidad')} display={item.cantidad != null ? String(item.cantidad) : '—'} align="right" numeric />
            </td>
            <td className="px-3 py-2 min-w-[120px]">
              <Cell {...cellProps(item, 'lugar')} display={item.lugar || '—'} />
            </td>
            <td className="px-3 py-2 min-w-[130px]">
              <Cell {...cellProps(item, 'costoGs')} display={formatPYG(item.costoGs)} align="right" numeric />
            </td>
            <td className="px-3 py-2 min-w-[110px]">
              <Cell {...cellProps(item, 'costoUsd')} display={formatUSD(item.costoUsd)} align="right" numeric />
            </td>
            <td className="px-3 py-2 min-w-[130px]">
              <Cell {...cellProps(item, 'precio')} display={formatPYG(item.precio)} align="right" numeric />
            </td>
            <td className="px-3 py-2 text-center">
              <button
                onClick={() => toggleAgotado(item)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${item.agotado ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
              >
                {item.agotado ? 'AGOTADO' : 'En Stock'}
              </button>
            </td>
          </>
        )}

        {isServicios && (
          <>
            <td className="px-3 py-2 min-w-[140px]">
              <Cell {...cellProps(item, 'pendiente')} display={item.pendiente || '—'} />
            </td>
            <td className="px-3 py-2 min-w-[70px]">
              <Cell {...cellProps(item, 'cantidad')} display={item.cantidad != null ? String(item.cantidad) : '—'} align="right" numeric />
            </td>
            <td className="px-3 py-2 min-w-[130px]">
              <Cell {...cellProps(item, 'costoGs')} display={formatPYG(item.costoGs)} align="right" numeric />
            </td>
            <td className="px-3 py-2 min-w-[130px]">
              <Cell {...cellProps(item, 'precio')} display={formatPYG(item.precio)} align="right" numeric />
            </td>
          </>
        )}

        {isGenerica && (
          <>
            <td className="px-3 py-2 min-w-[130px]">
              <Cell {...cellProps(item, 'precio')} display={formatPYG(item.precio)} align="right" numeric />
            </td>
            <td className="px-3 py-2 min-w-[180px]">
              <Cell {...cellProps(item, 'notas')} display={item.notas || '—'} />
            </td>
          </>
        )}

        <td className="px-3 py-2 text-center">
          <button
            onClick={() => deleteItem(item.id)}
            className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
            title="Eliminar fila"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    ));

  // ─── Render ───
  return (
    <div className="min-h-screen p-4 sm:p-6 text-white">

      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur transition-all ${toast.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' : 'border-red-500/30 bg-red-500/20 text-red-300'}`}>
          {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && importRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-400" />
                Vista previa · {importFileName}
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Se detectaron <span className="text-white font-semibold">{importRows.length}</span> filas. Las primeras 5:
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/5 mb-6">
              <table className="w-full text-xs">
                <tbody>
                  {importRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {row.slice(0, 8).map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-zinc-300 truncate max-w-[120px]">{String(cell ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-amber-400/80 mb-4 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Esta acción reemplazará todos los ítems actuales de esta lista.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5">
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Confirmar importación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva lista */}
      {showNewLista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Nueva Lista de Precios</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Nombre</label>
                <input
                  autoFocus
                  type="text"
                  value={newListaNombre}
                  onChange={e => setNewListaNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createLista()}
                  placeholder="Ej: Lista Temporada Invierno"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Tipo de columnas</label>
                <select
                  value={newListaTipo}
                  onChange={e => setNewListaTipo(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0f0f1a] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                >
                  <option value="GENERICA">Genérica (Nombre, Precio, Notas)</option>
                  <option value="PRODUCTOS">Productos (Cant, Lugar, Costo, Precio, Estado)</option>
                  <option value="SERVICIOS">Servicios (Pendiente, Cant, Costo, Precio)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowNewLista(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5">Cancelar</button>
              <button onClick={createLista} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Renombrar */}
      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Renombrar Lista</h3>
            <input
              autoFocus
              type="text"
              value={renameTxt}
              onChange={e => setRenameTxt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && renameLista()}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowRename(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5">Cancelar</button>
              <button onClick={renameLista} className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-red-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">Eliminar lista</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-6">Se eliminarán <strong className="text-white">todos los ítems</strong> de <span className="text-violet-400">"{listaActiva?.nombre}"</span>. Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5">Cancelar</button>
              <button onClick={deleteLista} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Lista de Precios</h1>
            <p className="text-xs text-zinc-500">Clic en celda para editar · Enter avanza · Esc cancela · guardado automático</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lista dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08] transition"
            >
              <span className="max-w-[160px] truncate">{listaActiva?.nombre ?? 'Seleccionar lista'}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-white/10 bg-[#0f0f1a] shadow-2xl overflow-hidden">
                {/* Legacy listas */}
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Predefinidas</span>
                </div>
                {listas.filter(l => l.id.startsWith('__')).map(l => (
                  <button key={l.id} onClick={() => { setListaActiva(l); setDropdownOpen(false); }}
                    className={`flex w-full items-center px-4 py-2.5 text-sm transition hover:bg-white/5 ${listaActiva?.id === l.id ? 'text-violet-400 font-semibold' : 'text-zinc-300'}`}>
                    {l.nombre}
                  </button>
                ))}

                {/* Dynamic listas */}
                {listas.filter(l => !l.id.startsWith('__')).length > 0 && (
                  <>
                    <div className="px-3 pt-3 pb-1 border-t border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Mis listas</span>
                    </div>
                    {listas.filter(l => !l.id.startsWith('__')).map(l => (
                      <button key={l.id} onClick={() => { setListaActiva(l); setDropdownOpen(false); }}
                        className={`flex w-full items-center px-4 py-2.5 text-sm transition hover:bg-white/5 ${listaActiva?.id === l.id ? 'text-violet-400 font-semibold' : 'text-zinc-300'}`}>
                        {l.nombre}
                        <span className="ml-auto text-[10px] text-zinc-600 bg-white/5 rounded px-1.5 py-0.5">{l.tipo}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Create new */}
                <div className="border-t border-white/5 p-2">
                  <button onClick={() => { setShowNewLista(true); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-violet-400 hover:bg-violet-500/10 transition font-semibold">
                    <Plus className="h-4 w-4" />
                    Nueva lista de precios
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions for current lista */}
          {!isLegacy && listaActiva && (
            <>
              <button
                onClick={() => { setRenameTxt(listaActiva.nombre); setShowRename(true); }}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] transition"
              >
                <Edit3 className="h-3.5 w-3.5" /> Renombrar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/15 transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar lista
              </button>
            </>
          )}

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
          >
            <FolderOpen className="h-4 w-4" />
            Importar Excel
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <Download className="h-4 w-4" />
            Descargar .xlsx
          </button>
        </div>
      </div>

      {/* ─── Table ─── */}
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
                  <th className="w-8 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">#</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {isProductos ? 'Artículo' : isServicios ? 'Servicio' : 'Nombre'}
                  </th>
                  {isProductos && <>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Cant.</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Lugar</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Costo Gs.</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Costo USD</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Precio Venta</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">Estado</th>
                  </>}
                  {isServicios && <>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Pendiente</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Cant.</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Costo Gs.</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Precio Venta</th>
                  </>}
                  {isGenerica && <>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Precio</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Notas</th>
                  </>}
                  <th className="w-8 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && grupos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-zinc-500">
                      No hay ítems. Importá desde Excel o agregá uno manualmente.
                    </td>
                  </tr>
                ) : grupos.length > 0 ? (
                  // Render with groups
                  <>
                    {/* Items without group */}
                    {itemsByGrupo(null).length > 0 && renderRows(itemsByGrupo(null))}

                    {/* Groups */}
                    {grupos.map(grupo => (
                      <>
                        {/* Group header row */}
                        <tr key={`g-${grupo.id}`} className="bg-white/[0.03] border-y border-white/10">
                          <td colSpan={10} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <Layers className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                              {editingGrupo === grupo.id ? (
                                <input
                                  autoFocus
                                  value={editGrupoName}
                                  onChange={e => setEditGrupoName(e.target.value)}
                                  onBlur={() => saveGrupo(grupo.id)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveGrupo(grupo.id); if (e.key === 'Escape') setEditingGrupo(null); }}
                                  className="bg-transparent border-b border-violet-500 text-sm font-semibold text-white outline-none w-48"
                                />
                              ) : (
                                <span
                                  className="text-sm font-semibold text-zinc-200 cursor-pointer hover:text-white"
                                  onClick={() => { setEditingGrupo(grupo.id); setEditGrupoName(grupo.nombre); }}
                                >
                                  {grupo.nombre}
                                </span>
                              )}
                              <span className="text-xs text-zinc-600 ml-1">({itemsByGrupo(grupo.id).length} ítems)</span>
                              <div className="ml-auto flex items-center gap-1">
                                <button onClick={() => addRow(grupo.id)} className="rounded p-1 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition text-xs flex items-center gap-1">
                                  <PlusCircle className="h-3.5 w-3.5" /> Agregar
                                </button>
                                <button onClick={() => deleteGrupo(grupo.id)} className="rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {renderRows(itemsByGrupo(grupo.id))}
                      </>
                    ))}
                  </>
                ) : (
                  // Render flat (no groups)
                  renderRows(items)
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer actions */}
        {!loading && (
          <div className="border-t border-white/5 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => addRow()}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-violet-400"
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </button>
            {!isLegacy && (
              <button
                onClick={addGrupo}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-violet-400"
              >
                <Layers className="h-4 w-4" />
                Agregar grupo
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-600">{items.length} {items.length === 1 ? 'ítem' : 'ítems'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
