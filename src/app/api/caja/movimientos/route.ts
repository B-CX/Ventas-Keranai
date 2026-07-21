export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// POST /api/caja/movimientos → Registra un ingreso o retiro manual
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { cajaId, tipo, moneda, monto, descripcion } = await req.json();

    if (!cajaId || !tipo || !moneda || monto === undefined || !descripcion) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (!['INGRESO', 'EGRESO'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    if (!['PYG', 'USD'].includes(moneda)) {
      return NextResponse.json({ error: 'Moneda inválida' }, { status: 400 });
    }

    // Verificar que la caja esté abierta
    const caja = await db.cajaSession.findUnique({ where: { id: cajaId } });
    if (!caja || caja.estado !== 'ABIERTA') {
      return NextResponse.json({ error: 'Caja no encontrada o ya cerrada' }, { status: 404 });
    }

    const movimiento = await db.cajaMovimiento.create({
      data: {
        cajaId,
        tipo,
        moneda,
        monto: Number(monto),
        descripcion,
      },
    });

    return NextResponse.json(movimiento);
  } catch (error) {
    console.error('Error creating movimiento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
