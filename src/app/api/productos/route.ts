import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoriaId') || '';

    const whereClause: any = {};

    // Búsqueda de texto
    if (search) {
      whereClause.OR = [
        { nombre: { contains: search } },
        { descripcion: { contains: search } },
      ];
    }

    if (categoryId) {
      whereClause.categoriaId = categoryId;
    }

    // Si es Vendedor, solo ver productos activos
    const role = (session.user as any)?.role;
    if (role === 'VENDEDOR') {
      whereClause.activo = true;
    }

    const productos = await db.producto.findMany({
      where: whereClause,
      include: {
        variantes: true,
        categoria: { include: { grupo: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al listar los productos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { nombre, descripcion, categoriaId, imagen, variantes } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const producto = await db.producto.create({
      data: {
        nombre,
        descripcion,
        categoriaId: categoriaId || null,
        imagen: imagen || null,
        variantes: {
          create: (variantes || []).map((v: any) => ({
            nombre: v.nombre,
            precio: parseFloat(v.precio || 0),
            precioUsd: parseFloat(v.precioUsd || 0),
            stock: parseInt(v.stock || 0),
            sku: v.sku || null,
          })),
        },
      },
      include: {
        variantes: true,
      },
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 });
  }
}
