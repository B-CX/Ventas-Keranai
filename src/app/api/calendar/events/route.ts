export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getGoogleOAuth2Client } from '@/lib/google-calendar';
import { google } from 'googleapis';

// Map our color names to Google Calendar colorId
const COLOR_MAPPING: Record<string, string> = {
  violeta: '9',  // Blueberry
  azul: '7',     // Peacock
  verde: '10',   // Basil
  rojo: '11',    // Tomato
  amarillo: '5', // Banana
  gris: '8',     // Graphite
};

// Map Google Calendar colorId back to our color names
const GOOGLE_COLOR_MAPPING: Record<string, string> = {
  '9': 'violeta',
  '7': 'azul',
  '10': 'verde',
  '11': 'rojo',
  '5': 'amarillo',
  '8': 'gris',
};

// GET /api/calendar/events - list events
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const timeMin = req.nextUrl.searchParams.get('timeMin') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = req.nextUrl.searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const userId = (session.user as any).id;
  const oauth2Client = await getGoogleOAuth2Client(userId);

  try {
    const eventos = await db.calendarEvent.findMany({
      where: {
        start: { lte: timeMax },
        end: { gte: timeMin },
      },
      orderBy: {
        start: 'asc'
      }
    });

    const mappedEvents = eventos.map((evt) => ({
      id: evt.id,
      nombre: evt.titulo,
      descripcion: evt.descripcion || '',
      color: evt.color,
      start: evt.start,
      end: evt.end,
      todoElDia: evt.todoElDia,
      recordatorio: evt.recordatorio,
      googleId: evt.googleId,
    }));

    return NextResponse.json({
      events: mappedEvents,
      isGoogleConnected: !!oauth2Client
    });
  } catch (err: any) {
    console.error('Error fetching calendar events:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/calendar/events - create event
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const { nombre, descripcion, color, start, end, todoElDia, recordatorio } = body;

  if (!nombre || !start || !end) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const oauth2Client = await getGoogleOAuth2Client(userId);
  let googleEventId = null;

  if (oauth2Client) {
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

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });

      googleEventId = response.data.id;
    } catch (err) {
      console.error('Error syncing with Google Calendar on POST:', err);
      // Continuamos aunque falle Google Calendar
    }
  }

  try {
    const newEvent = await db.calendarEvent.create({
      data: {
        titulo: nombre,
        descripcion: descripcion || '',
        color: color || 'violeta',
        start,
        end,
        todoElDia: !!todoElDia,
        recordatorio: !!recordatorio,
        googleId: googleEventId,
      }
    });

    // Crear notificación de calendario
    await db.notificacion.create({
      data: {
        tipo: 'EVENTO',
        titulo: 'Nuevo Evento Agendado',
        mensaje: nombre,
        link: '/admin/calendario'
      }
    });

    return NextResponse.json({
      id: newEvent.id,
      nombre: newEvent.titulo,
      descripcion: newEvent.descripcion || '',
      color: newEvent.color,
      start: newEvent.start,
      end: newEvent.end,
      todoElDia: newEvent.todoElDia,
      recordatorio: newEvent.recordatorio,
      googleId: newEvent.googleId,
    });
  } catch (err: any) {
    console.error('Error creating calendar event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
