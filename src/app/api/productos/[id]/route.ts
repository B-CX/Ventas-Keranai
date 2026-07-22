export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const producto = await db.producto.findUnique({
      where: { id },
      include: {
        variantes: true,
      },
    });

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener el producto' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { nombre, descripcion, categoriaId, activo, imagen, variantes } = body;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // 1. Actualizar datos básicos del producto
    await db.producto.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || null,
        categoriaId: categoriaId || null,
        activo: activo !== undefined ? activo : true,
        imagen: imagen !== undefined ? imagen : undefined,
      },
    });

    if (variantes && Array.isArray(variantes)) {
      // Obtener las variantes actuales para saber cuáles eliminar
      const currentVariantes = await db.variante.findMany({
        where: { productoId: id },
      });

      const incomingIds = variantes.filter((v: any) => v.id).map((v: any) => v.id);
      const toDeleteIds = currentVariantes.filter((v) => !incomingIds.includes(v.id)).map((v) => v.id);

      // Eliminar las que ya no vienen
      if (toDeleteIds.length > 0) {
        await db.variante.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      // Crear o actualizar las variantes recibidas
      for (const v of variantes) {
        if (v.id) {
          await db.variante.update({
            where: { id: v.id },
            data: {
              nombre: v.nombre,
              precio: parseFloat(v.precio || 0),
              precioUsd: parseFloat(v.precioUsd || 0),
              stock: parseInt(v.stock || 0),
              sku: v.sku || null,
            },
          });
        } else {
          await db.variante.create({
            data: {
              productoId: id,
              nombre: v.nombre,
              precio: parseFloat(v.precio || 0),
              precioUsd: parseFloat(v.precioUsd || 0),
              stock: parseInt(v.stock || 0),
              sku: v.sku || null,
            },
          });
        }
      }
    }

    const finalProduct = await db.producto.findUnique({
      where: { id },
      include: { variantes: true, categoria: { include: { grupo: true } } },
    });

    return NextResponse.json(finalProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Se elimina el producto directamente. Si existen ventas asociadas a sus variantes,
    // varianteId se establecerá en NULL (SetNull) preservando el registro e historial de la venta.
    await db.producto.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 });
  }
}
