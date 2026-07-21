export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    const categorias = await db.gastoCategoria.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar categorias' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden crear categorías' }, { status: 401 });
    }

    const { nombre, descripcion } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const nueva = await db.gastoCategoria.create({
      data: {
        nombre: nombre.toUpperCase(),
        descripcion
      }
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'La categoría ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear categoria' }, { status: 500 });
  }
}
