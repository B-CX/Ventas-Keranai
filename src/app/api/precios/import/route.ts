import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

// POST /api/precios/import
// Body: { listaId: string, tipo: string, rows: any[][] }
// OR legacy: ?lista=PRODUCTOS with file path (kept for backward compat)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { listaId, tipo, rows: rawRows } = body;

  if (!listaId || !rawRows) {
    return NextResponse.json({ error: 'listaId y rows son requeridos' }, { status: 400 });
  }

  // Clear existing items for this lista
  await db.precioItem.deleteMany({ where: { listaId } });

  const itemsToCreate: any[] = [];

  if (tipo === 'PRODUCTOS') {
    // Expected columns: [#, CANTIDAD, LUGAR, ARTÍCULO, COSTO GS, COSTO USD, PRECIO VENTA, AGOTADOS]
    // Try to auto-detect header row
    let startRow = 0;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const rowStr = rawRows[i].map((c: any) => String(c || '').toUpperCase()).join(' ');
      if (rowStr.includes('ARTÍCULO') || rowStr.includes('ARTICULO') || rowStr.includes('NOMBRE')) {
        startRow = i + 1;
        break;
      }
    }

    for (let i = startRow; i < rawRows.length; i++) {
      const row = rawRows[i];
      const nombre = row[3] ?? row[1];
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') continue;

      itemsToCreate.push({
        lista: listaId,
        listaId,
        nombre: String(nombre).trim(),
        cantidad: row[1] != null && row[1] !== '' ? Number(row[1]) : null,
        lugar: row[2] != null && row[2] !== '' ? String(row[2]).trim() : null,
        costoGs: row[4] != null && row[4] !== '' ? Number(row[4]) : null,
        costoUsd: row[5] != null && row[5] !== '' ? Number(row[5]) : null,
        precio: row[6] != null && row[6] !== '' ? Number(row[6]) : 0,
        moneda: 'PYG',
        agotado: Boolean(row[7]),
        orden: itemsToCreate.length,
      });
    }
  } else if (tipo === 'SERVICIOS') {
    let startRow = 0;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const rowStr = rawRows[i].map((c: any) => String(c || '').toUpperCase()).join(' ');
      if (rowStr.includes('SERVICIO') || rowStr.includes('NOMBRE')) {
        startRow = i + 1;
        break;
      }
    }

    for (let i = startRow; i < rawRows.length; i++) {
      const row = rawRows[i];
      const nombre = row[1];
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') continue;

      itemsToCreate.push({
        lista: listaId,
        listaId,
        nombre: String(nombre).trim(),
        pendiente: row[2] != null && row[2] !== '' ? String(row[2]).trim() : null,
        cantidad: row[3] != null && row[3] !== '' ? Number(row[3]) : null,
        costoGs: row[4] != null && row[4] !== '' ? Number(row[4]) : null,
        precio: row[5] != null && row[5] !== '' ? Number(row[5]) : 0,
        moneda: 'PYG',
        orden: itemsToCreate.length,
      });
    }
  } else {
    // GENERICA: try col 0 or 1 for nombre, col 1 or 2 for precio
    let startRow = 0;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const rowStr = rawRows[i].map((c: any) => String(c || '').toUpperCase()).join(' ');
      if (rowStr.includes('NOMBRE') || rowStr.includes('ARTÍCULO') || rowStr.includes('ITEM')) {
        startRow = i + 1;
        break;
      }
    }

    for (let i = startRow; i < rawRows.length; i++) {
      const row = rawRows[i];
      const nombre = row[0] ?? row[1];
      if (!nombre || String(nombre).trim() === '') continue;

      itemsToCreate.push({
        lista: listaId,
        listaId,
        nombre: String(nombre).trim(),
        precio: row[1] != null && row[1] !== '' ? Number(row[1]) : 0,
        notas: row[2] != null && row[2] !== '' ? String(row[2]).trim() : null,
        moneda: 'PYG',
        orden: itemsToCreate.length,
      });
    }
  }

  for (const item of itemsToCreate) {
    await db.precioItem.create({ data: item });
  }

  return NextResponse.json({ ok: true, importados: itemsToCreate.length });
}
