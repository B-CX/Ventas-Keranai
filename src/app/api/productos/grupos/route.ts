import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const grupos = await db.productoGrupo.findMany({
      include: {
        categorias: true
      },
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(grupos);
  } catch (error) {
    console.error('Error fetching grupos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, descripcion } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'Falta el nombre del grupo' }, { status: 400 });
    }

    const grupo = await db.productoGrupo.create({
      data: {
        nombre: nombre.toUpperCase(),
        descripcion
      }
    });

    return NextResponse.json(grupo, { status: 201 });
  } catch (error: any) {
    console.error('Error creating grupo:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un grupo con ese nombre' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
