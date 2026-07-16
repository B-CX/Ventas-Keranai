import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const oauth2Client = await getGoogleOAuth2Client(userId);

  if (!oauth2Client) {
    return NextResponse.json({ error: 'No conectado a Google Calendar.' }, { status: 403 });
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const body = await req.json();
  const { nombre, descripcion, color, start, end, todoElDia, recordatorio } = body;

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

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: params.id,
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
    console.error('Error updating calendar event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/calendar/events/[id] - delete event
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const oauth2Client = await getGoogleOAuth2Client(userId);

  if (!oauth2Client) {
    return NextResponse.json({ error: 'No conectado a Google Calendar.' }, { status: 403 });
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: params.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting calendar event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
