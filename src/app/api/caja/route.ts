export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar caja abierta del usuario actual
    const cajaActiva = await db.cajaSession.findFirst({
      where: {
        usuarioId: session.user.id,
        estado: 'ABIERTA',
      },
      include: {
        ventas: true,
        gastos: true,
        compras: true,
        movimientos: true,
      }
    });

    return NextResponse.json(cajaActiva);
  } catch (error) {
    console.error('Error fetching caja:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si ya hay una abierta
    const existente = await db.cajaSession.findFirst({
      where: { usuarioId: session.user.id, estado: 'ABIERTA' }
    });

    if (existente) {
      return NextResponse.json({ error: 'Ya tienes una caja abierta' }, { status: 400 });
    }

    const { saldoInicial, saldoInicialUsd } = await req.json();

    if (saldoInicial === undefined || saldoInicialUsd === undefined) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const nuevaCaja = await db.cajaSession.create({
      data: {
        usuarioId: session.user.id,
        saldoInicial: Number(saldoInicial),
        saldoInicialUsd: Number(saldoInicialUsd),
      },
    });

    return NextResponse.json(nuevaCaja);
  } catch (error) {
    console.error('Error opening caja:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { cajaId, saldoFinal, saldoFinalUsd, notas } = body;

    if (!cajaId || saldoFinal === undefined || saldoFinalUsd === undefined) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const activeSession = await db.cajaSession.findUnique({
      where: { id: cajaId },
      include: { ventas: true, gastos: true, compras: true, movimientos: true }
    });

    if (!activeSession || activeSession.estado !== 'ABIERTA') {
      return NextResponse.json({ error: 'Caja no encontrada o ya cerrada' }, { status: 404 });
    }

    // Calcular ingresos y egresos en PYG
    const ingresosEfectivoPyg = activeSession.ventas
      .filter((v) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'PYG' && v.estado === 'COMPLETADA')
      .reduce((sum, v) => sum + v.total, 0);

    const egresosGastosPyg = activeSession.gastos
      .filter(g => g.moneda === 'PYG')
      .reduce((sum, g) => sum + g.monto, 0);
      
    const egresosComprasPyg = activeSession.compras
      .filter(c => c.moneda === 'PYG')
      .reduce((sum, c) => sum + c.total, 0);

    const ingresosMovPyg = activeSession.movimientos
      .filter((m) => m.tipo === 'INGRESO' && m.moneda === 'PYG')
      .reduce((sum, m) => sum + m.monto, 0);

    const egresosMovPyg = activeSession.movimientos
      .filter((m) => m.tipo === 'EGRESO' && m.moneda === 'PYG')
      .reduce((sum, m) => sum + m.monto, 0);

    const balanceEsperadoPyg =
      activeSession.saldoInicial +
      ingresosEfectivoPyg +
      ingresosMovPyg -
      egresosGastosPyg -
      egresosComprasPyg -
      egresosMovPyg;

    const diferenciaPyg = Number(saldoFinal) - balanceEsperadoPyg;

    // Calcular ingresos y egresos en USD
    const ingresosEfectivoUsd = activeSession.ventas
      .filter((v) => v.metodoPago === 'EFECTIVO' && v.monedaCobro === 'USD' && v.estado === 'COMPLETADA')
      .reduce((sum, v) => sum + (v.total / (v.cotizacionUsd || 7500)), 0);

    const egresosGastosUsd = activeSession.gastos
      .filter(g => g.moneda === 'USD')
      .reduce((sum, g) => sum + g.monto, 0);
      
    const egresosComprasUsd = activeSession.compras
      .filter(c => c.moneda === 'USD')
      .reduce((sum, c) => sum + c.total, 0);

    const ingresosMovUsd = activeSession.movimientos
      .filter((m) => m.tipo === 'INGRESO' && m.moneda === 'USD')
      .reduce((sum, m) => sum + m.monto, 0);

    const egresosMovUsd = activeSession.movimientos
      .filter((m) => m.tipo === 'EGRESO' && m.moneda === 'USD')
      .reduce((sum, m) => sum + m.monto, 0);

    const balanceEsperadoUsd =
      activeSession.saldoInicialUsd +
      ingresosEfectivoUsd +
      ingresosMovUsd -
      egresosGastosUsd -
      egresosComprasUsd -
      egresosMovUsd;

    const diferenciaUsd = Number(saldoFinalUsd) - balanceEsperadoUsd;

    const cajaCerrada = await db.cajaSession.update({
      where: { id: activeSession.id },
      data: {
        estado: 'CERRADA',
        fechaCierre: new Date(),
        saldoFinal: Number(saldoFinal),
        saldoFinalUsd: Number(saldoFinalUsd),
        diferencia: diferenciaPyg,
        diferenciaUsd: diferenciaUsd,
        notas,
      },
    });

    return NextResponse.json(cajaCerrada);
  } catch (error) {
    console.error('Error closing caja:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
