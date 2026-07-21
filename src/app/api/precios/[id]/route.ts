export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// PUT /api/precios/[id] - editar ítem
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { nombre, precio, moneda, cantidad, costoGs, costoUsd, lugar, agotado, pendiente, notas, grupoId } = body;

  const item = await db.precioItem.update({
    where: { id },
    data: {
      nombre: nombre !== undefined ? nombre : undefined,
      precio: precio !== undefined ? Number(precio) : undefined,
      moneda: moneda !== undefined ? moneda : undefined,
      cantidad: cantidad !== undefined ? (cantidad !== '' && cantidad != null ? Number(cantidad) : null) : undefined,
      costoGs: costoGs !== undefined ? (costoGs !== '' && costoGs != null ? Number(costoGs) : null) : undefined,
      costoUsd: costoUsd !== undefined ? (costoUsd !== '' && costoUsd != null ? Number(costoUsd) : null) : undefined,
      lugar: lugar !== undefined ? (lugar || null) : undefined,
      agotado: agotado !== undefined ? Boolean(agotado) : undefined,
      pendiente: pendiente !== undefined ? (pendiente || null) : undefined,
      notas: notas !== undefined ? (notas || null) : undefined,
      grupoId: grupoId !== undefined ? (grupoId || null) : undefined,
    },
    include: { grupo: true },
  });

  return NextResponse.json(item);
}

// DELETE /api/precios/[id] - eliminar ítem
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  await db.precioItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
