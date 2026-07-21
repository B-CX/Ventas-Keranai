export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const vendedorId = searchParams.get('vendedorId') || '';
    const clienteId = searchParams.get('clienteId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: any = {};
    if (vendedorId) where.vendedorId = vendedorId;
    if (clienteId) where.clienteId = clienteId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const ventas = await db.venta.findMany({
      where,
      include: {
        vendedor: { select: { name: true } },
        cliente: { select: { nombre: true, telefono: true, email: true } },
        items: {
          include: {
            variante: {
              include: {
                producto: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(ventas);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al listar las ventas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { clienteId, items, notas, metodoPago, monedaCobro, cotizacionUsd } = await req.json();
    const vendedorId = (session.user as any).id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un item para registrar la venta' }, { status: 400 });
    }

    // Ejecutar la venta en una transacción atómica para asegurar la integridad del inventario
    const result = await db.$transaction(async (tx) => {
      let total = 0;
      const createdItems = [];

      for (const item of items) {
        if (!item.varianteId || !item.cantidad || item.cantidad <= 0) {
          throw new Error('Datos de item inválidos');
        }

        // Obtener variante y bloquear stock
        const variant = await tx.variante.findUnique({
          where: { id: item.varianteId },
          include: { producto: true },
        });

        if (!variant) {
          throw new Error(`Variante con ID ${item.varianteId} no existe.`);
        }

        if (!variant.producto.activo) {
          throw new Error(`El producto "${variant.producto.nombre}" está desactivado.`);
        }

        if (variant.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente para "${variant.producto.nombre} - ${variant.nombre}". Solicitado: ${item.cantidad}, disponible: ${variant.stock}.`
          );
        }

        // Descontar stock
        await tx.variante.update({
          where: { id: item.varianteId },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });

        total += variant.precio * item.cantidad;
        createdItems.push({
          varianteId: item.varianteId,
          cantidad: item.cantidad,
          precio: variant.precio,
        });
      }

      // Buscar caja activa
      const cajaActiva = await tx.cajaSession.findFirst({
        where: { usuarioId: vendedorId, estado: 'ABIERTA' }
      });

      // Registrar venta
      const venta = await tx.venta.create({
        data: {
          vendedorId,
          clienteId: clienteId || null,
          cajaId: cajaActiva ? cajaActiva.id : null,
          notas,
          total,
          metodoPago: metodoPago || 'EFECTIVO',
          monedaCobro: monedaCobro || 'PYG',
          cotizacionUsd: cotizacionUsd || null,
          estado: 'COMPLETADA',
          items: {
            create: createdItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Crear notificación de venta
      await tx.notificacion.create({
        data: {
          tipo: 'VENTA',
          titulo: 'Nueva Venta Registrada',
          mensaje: `Total: ${monedaCobro === 'USD' ? 'USD ' : 'Gs. '}${total}`,
          link: '/admin/ventas'
        }
      });

      return venta;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Error al procesar la venta' }, { status: 400 });
  }
}
