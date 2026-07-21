export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, email, password, role, activo, imagen } = await req.json();
    const { id: userId } = await params;

    // Evitar que el admin se desactive a sí mismo
    if (userId === (session.user as any).id && activo === false) {
      return NextResponse.json({ error: 'No podés desactivar tu propia cuenta' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (role !== undefined) dataToUpdate.role = role;
    if (activo !== undefined) dataToUpdate.activo = activo;
    if (imagen !== undefined) dataToUpdate.imagen = imagen;
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activo: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 });
  }
}
