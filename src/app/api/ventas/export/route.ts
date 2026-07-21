export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return new NextResponse('No autorizado', { status: 401 });
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
      if (startDate) where.createdAt.gte = new Date(startDate);
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
        cliente: { select: { nombre: true } },
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

    // Generar formato CSV
    const csvHeaders = ['Fecha', 'ID Venta', 'Vendedor', 'Cliente', 'Productos', 'Total ($)', 'Notas'];
    const csvRows = ventas.map((venta) => {
      const fecha = new Date(venta.createdAt).toLocaleString('es-AR');
      const vendedor = venta.vendedor.name;
      const cliente = venta.cliente?.nombre || 'Cliente Ocasional';
      
      const productos = venta.items
        .map((item) => `${item.variante.producto.nombre} - ${item.variante.nombre} (x${item.cantidad})`)
        .join(' | ')
        .replace(/"/g, '""');
      
      const total = venta.total.toFixed(2);
      const notas = venta.notas ? venta.notas.replace(/"/g, '""').replace(/\r?\n|\r/g, ' ') : '';

      return [
        `"${fecha}"`,
        `"${venta.id}"`,
        `"${vendedor}"`,
        `"${cliente}"`,
        `"${productos}"`,
        total,
        `"${notas}"`,
      ].join(',');
    });

    // Añadir BOM (Byte Order Mark) UTF-8 para compatibilidad directa con Excel
    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=reporte-ventas.csv',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error al exportar CSV', { status: 500 });
  }
}
