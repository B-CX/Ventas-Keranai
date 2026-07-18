import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    let config = await db.configuracion.findUnique({
      where: { id: 'GLOBAL' }
    });

    if (!config) {
      config = await db.configuracion.create({
        data: { id: 'GLOBAL', cotizacionUsd: 7500 }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching configuracion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Se requiere rol de Administrador.' }, { status: 401 });
    }

    const body = await req.json();
    const { cotizacionUsd } = body;

    if (!cotizacionUsd || isNaN(Number(cotizacionUsd))) {
      return NextResponse.json({ error: 'Cotización inválida' }, { status: 400 });
    }

    const updated = await db.configuracion.upsert({
      where: { id: 'GLOBAL' },
      update: { cotizacionUsd: Number(cotizacionUsd) },
      create: { id: 'GLOBAL', cotizacionUsd: Number(cotizacionUsd) }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating configuracion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
