import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET /api/precios?lista=PRODUCTOS
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

  return NextResponse.json(items);
}

// POST /api/precios - crear nuevo ítem
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { lista, nombre, precio, moneda, cantidad, costoGs, costoUsd, lugar, agotado, pendiente } = body;

  if (!lista || !nombre) {
    return NextResponse.json({ error: 'lista y nombre son requeridos' }, { status: 400 });
  }

  // Calcular el siguiente orden
  const lastItem = await db.precioItem.findFirst({
    where: { lista },
    orderBy: { orden: 'desc' },
  });
  const orden = lastItem ? lastItem.orden + 1 : 0;

  const item = await db.precioItem.create({
    data: {
      lista,
      nombre: nombre || '',
      precio: Number(precio) || 0,
      moneda: moneda || 'PYG',
      cantidad: cantidad != null ? Number(cantidad) : null,
      costoGs: costoGs != null ? Number(costoGs) : null,
      costoUsd: costoUsd != null ? Number(costoUsd) : null,
      lugar: lugar || null,
      agotado: Boolean(agotado),
      pendiente: pendiente || null,
      orden,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
