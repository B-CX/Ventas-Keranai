import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// GET /api/caja/historial → Lista todas las cajas CERRADAS
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const historial = await db.cajaSession.findMany({
      where: { estado: 'CERRADA' },
      include: {
        usuario: { select: { name: true } },
        ventas: true,
        gastos: true,
        compras: true,
        movimientos: true,
      },
      orderBy: { fechaCierre: 'desc' },
      take: 30,
    });

    return NextResponse.json(historial);
  } catch (error) {
    console.error('Error fetching historial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
