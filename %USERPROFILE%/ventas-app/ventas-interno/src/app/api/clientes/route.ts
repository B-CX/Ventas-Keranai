import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const where: any = {};
    if (q) {
      where.OR = [
        { nombre: { contains: q } },
        { email: { contains: q } },
        { telefono: { contains: q } },
      ];
    }

    const clientes = await db.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al listar los clientes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { nombre, telefono, email, notas } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const cliente = await db.cliente.create({
      data: {
        nombre,
        telefono,
        email,
        notas,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
  }
}
