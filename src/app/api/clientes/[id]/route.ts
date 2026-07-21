export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const cliente = await db.cliente.findUnique({
      where: { id },
      include: {
        ventas: {
          orderBy: { createdAt: 'desc' },
          include: {
            vendedor: { select: { name: true } },
            items: {
              include: {
                variante: {
                  include: {
                    producto: { select: { nombre: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener el cliente' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { nombre, telefono, email, notas, imagen } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const updatedCliente = await db.cliente.update({
      where: { id },
      data: {
        nombre,
        telefono,
        email,
        notas,
        imagen,
      },
    });

    return NextResponse.json(updatedCliente);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    await db.cliente.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 });
  }
}
