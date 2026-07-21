export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

// GET /api/precios/export?lista=PRODUCTOS
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const lista = req.nextUrl.searchParams.get('lista') || 'PRODUCTOS';

  const items = await db.precioItem.findMany({
    where: { lista },
    orderBy: { orden: 'asc' },
  });

  const workbook = XLSX.utils.book_new();

  let sheetData: any[][];

  if (lista === 'PRODUCTOS') {
    sheetData = [
      ['', '', '', '', 'KERANAI - PRODUCTOS'],
      ['', '', '', '', 'Lista de Precios/Compras Productos'],
      [],
      [],
      [],
      ['', 'CANTIDAD', 'LUGAR', 'ARTÍCULO', 'COSTO GS.', 'COSTO USD.', 'PRECIOS VENTAS', 'AGOTADOS'],
      ...items.map((item) => [
        '',
        item.cantidad ?? '',
        item.lugar ?? '',
        item.nombre,
        item.costoGs ?? '',
        item.costoUsd ?? '',
        item.precio,
        item.agotado ? 'AGOTADO' : '',
      ]),
    ];
  } else {
    sheetData = [
      ['', '', '', '', 'KERANAI - AGENCIA DIGITAL'],
      ['', '', '', '', 'Lista de Precios Servicios'],
      [],
      [],
      [],
      ['', 'SERVICIOS', 'PENDIENTES', 'CANTIDAD', 'COSTO', 'VENTAS'],
      ...items.map((item) => [
        '',
        item.nombre,
        item.pendiente ?? '',
        item.cantidad ?? '',
        item.costoGs ?? '',
        item.precio,
      ]),
    ];
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const filename =
    lista === 'PRODUCTOS'
      ? 'Lista-Precios-PRODUCTOS-KERANAI.xlsx'
      : 'Lista-Precios-SERVICIOS-AGENCIA.xlsx';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
