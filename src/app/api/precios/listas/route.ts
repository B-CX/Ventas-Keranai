export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET /api/precios/listas
export async function GET() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const listas = await db.precioLista.findMany({
    orderBy: { orden: 'asc' },
  });

  return NextResponse.json(listas);
}

// POST /api/precios/listas
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { nombre, descripcion, tipo } = await req.json();
  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const lastLista = await db.precioLista.findFirst({ orderBy: { orden: 'desc' } });
  const orden = lastLista ? lastLista.orden + 1 : 0;

  try {
    const lista = await db.precioLista.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        tipo: tipo || 'GENERICA',
        orden,
      },
    });
    return NextResponse.json(lista, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una lista con ese nombre' }, { status: 400 });
    }
    throw e;
  }
}
