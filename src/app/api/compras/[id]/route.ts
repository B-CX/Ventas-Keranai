export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

    const compra = await db.compra.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!compra) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      // Revertir el stock de cada item comprado
      for (const item of compra.items) {
        await tx.variante.update({
          where: { id: item.varianteId },
          data: {
            stock: {
              decrement: item.cantidad
            }
          }
        });
      }

      // Eliminar la compra (los items se eliminan por cascade si está configurado, o Prisma lo maneja)
      await tx.compra.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting compra:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
