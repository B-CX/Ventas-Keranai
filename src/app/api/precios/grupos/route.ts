import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// GET /api/precios/grupos?listaId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const listaId = req.nextUrl.searchParams.get('listaId');
  if (!listaId) {
    return NextResponse.json({ error: 'listaId requerido' }, { status: 400 });
  }

  const grupos = await db.precioGrupo.findMany({
    where: { listaId },
    orderBy: { orden: 'asc' },
  });

  return NextResponse.json(grupos);
}

// POST /api/precios/grupos
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { listaId, nombre } = await req.json();
  if (!listaId || !nombre?.trim()) {
    return NextResponse.json({ error: 'listaId y nombre son requeridos' }, { status: 400 });
  }

  const lastGrupo = await db.precioGrupo.findFirst({
    where: { listaId },
    orderBy: { orden: 'desc' },
  });
  const orden = lastGrupo ? lastGrupo.orden + 1 : 0;

  const grupo = await db.precioGrupo.create({
    data: { listaId, nombre: nombre.trim(), orden },
  });

  return NextResponse.json(grupo, { status: 201 });
}
