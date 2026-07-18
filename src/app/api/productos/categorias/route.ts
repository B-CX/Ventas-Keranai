import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const categorias = await db.productoCategoria.findMany({
      include: {
        grupo: true
      },
      orderBy: [
        { grupo: { nombre: 'asc' } },
        { nombre: 'asc' }
      ]
    });
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error fetching categorias:', error);
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
    const { nombre, descripcion, grupoId } = body;

    if (!nombre || !grupoId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const categoria = await db.productoCategoria.create({
      data: {
        nombre: nombre.toUpperCase(),
        descripcion,
        grupoId
      },
      include: {
        grupo: true
      }
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error: any) {
    console.error('Error creating categoria:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre en este grupo' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
