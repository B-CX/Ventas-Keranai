import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET /api/precios?listaId=xxx  OR  ?lista=PRODUCTOS (legacy)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const listaId = req.nextUrl.searchParams.get('listaId');
  const lista = req.nextUrl.searchParams.get('lista');

  let where: any = {};
  if (listaId) {
    where = { listaId };
  } else if (lista) {
    // Legacy: items without a listaId, matched by the legacy `lista` field
    where = { lista, listaId: null };
  }

  const items = await db.precioItem.findMany({
    where,
    orderBy: [{ orden: 'asc' }],
    include: { grupo: true },
  });

  return NextResponse.json(items);
}

// POST /api/precios - crear nuevo ítem
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { lista, listaId, nombre, precio, moneda, cantidad, costoGs, costoUsd, lugar, agotado, pendiente, notas, grupoId } = body;

  if (!nombre) {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
  }

  // Calcular el siguiente orden
  const where: any = listaId ? { listaId } : { lista, listaId: null };
  const lastItem = await db.precioItem.findFirst({
    where,
    orderBy: { orden: 'desc' },
  });
  const orden = lastItem ? lastItem.orden + 1 : 0;

  const item = await db.precioItem.create({
    data: {
      lista: lista || listaId || '',
      listaId: listaId || null,
      nombre: nombre || '',
      precio: Number(precio) || 0,
      moneda: moneda || 'PYG',
      cantidad: cantidad != null ? Number(cantidad) : null,
      costoGs: costoGs != null ? Number(costoGs) : null,
      costoUsd: costoUsd != null ? Number(costoUsd) : null,
      lugar: lugar || null,
      agotado: Boolean(agotado),
      pendiente: pendiente || null,
      notas: notas || null,
      grupoId: grupoId || null,
      orden,
    },
    include: { grupo: true },
  });

  return NextResponse.json(item, { status: 201 });
}
