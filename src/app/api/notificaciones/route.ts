export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user to get ultimaLecturaNotif
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { ultimaLecturaNotif: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Fetch last 30 notifications
    const notificaciones = await db.notificacion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Count how many are unread
    let unreadCount = 0;
    if (user.ultimaLecturaNotif) {
      unreadCount = notificaciones.filter(n => new Date(n.createdAt) > new Date(user.ultimaLecturaNotif!)).length;
    } else {
      unreadCount = notificaciones.length;
    }

    return NextResponse.json({
      notificaciones,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Update last read to now
    await db.user.update({
      where: { id: userId },
      data: { ultimaLecturaNotif: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ultimaLecturaNotif:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
