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
    const { cotizacionUsd, ticketHabilitado, ticketEmpresa, ticketContacto, appLogo, appName } = body;

    const dataToUpdate: any = {};
    if (cotizacionUsd !== undefined && !isNaN(Number(cotizacionUsd))) {
      dataToUpdate.cotizacionUsd = Number(cotizacionUsd);
    }
    if (ticketHabilitado !== undefined) {
      dataToUpdate.ticketHabilitado = Boolean(ticketHabilitado);
    }
    if (ticketEmpresa !== undefined) {
      dataToUpdate.ticketEmpresa = String(ticketEmpresa).trim();
    }
    if (ticketContacto !== undefined) {
      dataToUpdate.ticketContacto = String(ticketContacto).trim();
    }
    if (appLogo !== undefined) {
      dataToUpdate.appLogo = appLogo;
    }
    if (appName !== undefined) {
      dataToUpdate.appName = String(appName).trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No hay datos válidos para actualizar' }, { status: 400 });
    }

    const updated = await db.configuracion.upsert({
      where: { id: 'GLOBAL' },
      update: dataToUpdate,
      create: { 
        id: 'GLOBAL', 
        cotizacionUsd: dataToUpdate.cotizacionUsd || 7500,
        ticketHabilitado: dataToUpdate.ticketHabilitado ?? true,
        ticketEmpresa: dataToUpdate.ticketEmpresa ?? 'Sistema Keranai',
        ticketContacto: dataToUpdate.ticketContacto ?? 'keranai.com',
        appLogo: dataToUpdate.appLogo || null,
        appName: dataToUpdate.appName || 'Ventas Interno'
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating configuracion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
