import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const oauth2Client = await getGoogleOAuth2Client(userId);

  if (!oauth2Client) {
    return NextResponse.json(
      { error: 'No conectado a Google Calendar. Inicia sesión con Google.' },
      { status: 403 }
    );
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const timeMin = req.nextUrl.searchParams.get('timeMin') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = req.nextUrl.searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).map((evt) => {
      const isAllDay = !!evt.start?.date;
      return {
        id: evt.id,
        nombre: evt.summary || 'Sin título',
        descripcion: evt.description || '',
        color: GOOGLE_COLOR_MAPPING[evt.colorId || ''] || 'violeta',
        start: isAllDay ? evt.start?.date : evt.start?.dateTime,
        end: isAllDay ? evt.end?.date : evt.end?.dateTime,
        todoElDia: isAllDay,
        recordatorio: !!evt.reminders?.useDefault || (evt.reminders?.overrides && evt.reminders.overrides.length > 0),
      };
    });

    return NextResponse.json(events);
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

  const userId = (session.user as any).id;
  const oauth2Client = await getGoogleOAuth2Client(userId);

  if (!oauth2Client) {
    return NextResponse.json(
      { error: 'No conectado a Google Calendar.' },
      { status: 403 }
    );
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const body = await req.json();
  const { nombre, descripcion, color, start, end, todoElDia, recordatorio } = body;

  if (!nombre || !start || !end) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
  }

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
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    };
  } else {
    googleEvent.reminders = {
      useDefault: false,
      overrides: [],
    };
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    const evt = response.data;
    const isAllDay = !!evt.start?.date;

    return NextResponse.json({
      id: evt.id,
      nombre: evt.summary,
      descripcion: evt.description || '',
      color: GOOGLE_COLOR_MAPPING[evt.colorId || ''] || 'violeta',
      start: isAllDay ? evt.start?.date : evt.start?.dateTime,
      end: isAllDay ? evt.end?.date : evt.end?.dateTime,
      todoElDia: isAllDay,
      recordatorio,
    });
  } catch (err: any) {
    console.error('Error creating calendar event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
