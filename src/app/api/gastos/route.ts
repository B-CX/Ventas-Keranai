import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;

    const gastos = await db.gasto.findMany({
      take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        categoria: true,
        usuario: { select: { name: true } },
      }
    });

    return NextResponse.json(gastos);
  } catch (error) {
    console.error('Error fetching gastos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { categoriaId, monto, descripcion, moneda } = body;

    if (!categoriaId || !monto || !descripcion) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Buscar caja activa para vincular el gasto
    const cajaActiva = await db.cajaSession.findFirst({
      where: { usuarioId: session.user.id, estado: 'ABIERTA' }
    });

    const nuevoGasto = await db.gasto.create({
      data: {
        categoriaId,
        monto: Number(monto),
        descripcion,
        moneda: moneda || 'PYG',
        usuarioId: session.user.id,
        cajaId: cajaActiva ? cajaActiva.id : null,
      },
      include: {
        categoria: true
      }
    });

    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error) {
    console.error('Error creating gasto:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
