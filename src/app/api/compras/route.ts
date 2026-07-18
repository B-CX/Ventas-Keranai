import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { proveedor, notas, items } = body;
    // items debe ser array de { varianteId, cantidad, costoUnit }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un item para registrar la compra' }, { status: 400 });
    }

    const usuarioId = session.user.id;

    const result = await db.$transaction(async (tx) => {
      let total = 0;
      const createdItems = [];

      for (const item of items) {
        if (!item.varianteId || !item.cantidad || item.cantidad <= 0 || item.costoUnit < 0) {
          throw new Error('Datos de item inválidos');
        }

        const variant = await tx.variante.findUnique({
          where: { id: item.varianteId },
          include: { producto: true },
        });

        if (!variant) {
          throw new Error(`Variante con ID ${item.varianteId} no existe.`);
        }

        // Aumentar stock
        await tx.variante.update({
          where: { id: item.varianteId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        });

        const subtotal = item.costoUnit * item.cantidad;
        total += subtotal;

        createdItems.push({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
          costoUnit: item.costoUnit,
        });
      }

      // Buscar caja activa para vincular la compra (restará del balance)
      const cajaActiva = await tx.cajaSession.findFirst({
        where: { usuarioId, estado: 'ABIERTA' }
      });

      // Registrar compra
      const compra = await tx.compra.create({
        data: {
          usuarioId,
          cajaId: cajaActiva ? cajaActiva.id : null,
          proveedor: proveedor || null,
          notas: notas || null,
          total,
          moneda: moneda || 'PYG',
          items: {
            create: createdItems,
          },
        },
        include: {
          items: true,
        },
      });

      return compra;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating compra:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;

    const compras = await db.compra.findMany({
      take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: { select: { name: true } },
        items: {
          include: {
            variante: {
              include: { producto: { select: { nombre: true } } }
            }
          }
        }
      }
    });

    return NextResponse.json(compras);
  } catch (error) {
    console.error('Error fetching compras:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
