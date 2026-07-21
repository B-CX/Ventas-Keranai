export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getGoogleOAuth2Client } from '@/lib/google-calendar';
import { google } from 'googleapis';

const COLOR_MAPPING: Record<string, string> = {
  violeta: '9',
  azul: '7',
  verde: '10',
  rojo: '11',
  amarillo: '5',
  gris: '8',
};

const GOOGLE_COLOR_MAPPING: Record<string, string> = {
  '9': 'violeta',
  '7': 'azul',
  '10': 'verde',
  '11': 'rojo',
  '5': 'amarillo',
  '8': 'gris',
};

// PUT /api/calendar/events/[id] - update event
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { nombre, descripcion, color, start, end, todoElDia, recordatorio } = body;

  try {
    const currentEvent = await db.calendarEvent.findUnique({
      where: { id: params.id }
    });

    if (!currentEvent) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any)?.role === 'ADMIN';
    
    if (isAdmin) {
      const oauth2Client = await getGoogleOAuth2Client(userId);
      if (oauth2Client && currentEvent.googleId) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const googleEvent: any = {
          summary: nombre,
          description: descripcion || '',
          colorId: COLOR_MAPPING[color] || undefined,
          start: todoElDia
            ? { date: start.split('T')[0] }
            : { dateTime: start, timeZone: 'America/Asuncion' },
          end: todoElDia
            ? { date: end.split('T')[0] }
            : { dateTime: end, timeZone: 'America/Asuncion' },
        };

        if (recordatorio) {
          googleEvent.reminders = {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 30 }],
          };
        } else {
          googleEvent.reminders = {
            useDefault: false,
            overrides: [],
          };
        }

        await calendar.events.update({
          calendarId: 'primary',
          eventId: currentEvent.googleId,
          requestBody: googleEvent,
        });
      } catch (err) {
        console.error('Error updating Google Calendar event:', err);
      }
    }
  }

    const updatedEvent = await db.calendarEvent.update({
      where: { id: params.id },
      data: {
        titulo: nombre,
        descripcion: descripcion || '',
        color: color || 'violeta',
        start,
        end,
        todoElDia: !!todoElDia,
        recordatorio: !!recordatorio,
      }
    });

    return NextResponse.json({
      id: updatedEvent.id,
      nombre: updatedEvent.titulo,
      descripcion: updatedEvent.descripcion || '',
      color: updatedEvent.color,
      start: updatedEvent.start,
      end: updatedEvent.end,
      todoElDia: updatedEvent.todoElDia,
      recordatorio: updatedEvent.recordatorio,
      googleId: updatedEvent.googleId,
    });
  } catch (err: any) {
    console.error('Error updating calendar event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/calendar/events/[id] - delete event
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const currentEvent = await db.calendarEvent.findUnique({
      where: { id: params.id }
    });

    if (!currentEvent) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any)?.role === 'ADMIN';

    if (isAdmin) {
      const oauth2Client = await getGoogleOAuth2Client(userId);
      if (oauth2Client && currentEvent.googleId) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: currentEvent.googleId,
        });
      } catch (err) {
        console.error('Error deleting Google Calendar event:', err);
      }
    }
  }

    await db.calendarEvent.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting calendar event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
