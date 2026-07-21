export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// PUT /api/precios/grupos/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const { nombre } = await req.json();

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const grupo = await db.precioGrupo.update({
    where: { id },
    data: { nombre: nombre.trim() },
  });

  return NextResponse.json(grupo);
}

// DELETE /api/precios/grupos/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  // Desasociar ítems del grupo antes de eliminarlo
  await db.precioItem.updateMany({
    where: { grupoId: id },
    data: { grupoId: null },
  });

  await db.precioGrupo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
