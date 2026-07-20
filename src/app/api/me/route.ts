import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imagen: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener el usuario' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, imagen } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: (session.user as any).id },
      data: {
        name: name.trim(),
        imagen: imagen || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imagen: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 });
  }
}
