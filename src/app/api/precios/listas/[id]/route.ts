export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// PUT /api/precios/listas/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const { nombre, descripcion } = await req.json();

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  try {
    const lista = await db.precioLista.update({
      where: { id },
      data: { nombre: nombre.trim(), descripcion: descripcion || null },
    });
    return NextResponse.json(lista);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una lista con ese nombre' }, { status: 400 });
    }
    throw e;
  }
}

// DELETE /api/precios/listas/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  await db.precioLista.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
