import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';
import path from 'path';

const EXCEL_FILES: Record<string, string> = {
  PRODUCTOS: 'Lista de Precios PRODUCTOS - KERANAI PRODUCTOS.xlsx',
  SERVICIOS: 'Lista de Precios SERVICIOS- KERANAI AGENCIA DISEÑO DIGITAL.xlsx',
};

const BASE_PATH = 'D:\\TRABAJOS\\AGENCIA K\\KERANAI\\PRESUPUESTOS';

// POST /api/precios/import?lista=PRODUCTOS
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const lista = req.nextUrl.searchParams.get('lista') || 'PRODUCTOS';
  const fileName = EXCEL_FILES[lista];

  if (!fileName) {
    return NextResponse.json({ error: 'Lista inválida' }, { status: 400 });
  }

  try {
    const filePath = path.join(BASE_PATH, fileName);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Eliminar ítems existentes de esta lista
    await db.precioItem.deleteMany({ where: { lista } });

    const itemsToCreate: any[] = [];

    if (lista === 'PRODUCTOS') {
      // Headers en row 5 (índice): [_, CANTIDAD, LUGAR, ARTÍCULO, COSTO GS., COSTO USD., PRECIOS VENTAS, AGOTADOS]
      // Data desde row 6 (índice)
      for (let i = 6; i < rows.length; i++) {
        const row = rows[i];
        const nombre = row[3];
        if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') continue;

        itemsToCreate.push({
          lista: 'PRODUCTOS',
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
    } else if (lista === 'SERVICIOS') {
      // Headers en row 5 (índice): [_, SERVICIOS, PENDIENTES, CANTIDAD, COSTO, VENTAS]
      // Data desde row 6 (índice)
      for (let i = 6; i < rows.length; i++) {
        const row = rows[i];
        const nombre = row[1];
        if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') continue;

        itemsToCreate.push({
          lista: 'SERVICIOS',
          nombre: String(nombre).trim(),
          pendiente: row[2] != null && row[2] !== '' ? String(row[2]).trim() : null,
          cantidad: row[3] != null && row[3] !== '' ? Number(row[3]) : null,
          costoGs: row[4] != null && row[4] !== '' ? Number(row[4]) : null,
          precio: row[5] != null && row[5] !== '' ? Number(row[5]) : 0,
          moneda: 'PYG',
          orden: itemsToCreate.length,
        });
      }
    }

    // Insertar en lotes
    for (const item of itemsToCreate) {
      await db.precioItem.create({ data: item });
    }

    return NextResponse.json({
      ok: true,
      importados: itemsToCreate.length,
      lista,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: `Error al leer el archivo Excel: ${err.message}` },
      { status: 500 }
    );
  }
}
