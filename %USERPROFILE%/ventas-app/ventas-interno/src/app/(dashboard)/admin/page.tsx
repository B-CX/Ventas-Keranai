import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Don't cache dashboard stats

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/venta');
  }

  // Ejecutar consultas en paralelo para velocidad óptima
  const [
    totalVentasAggregate,
    totalVentasCount,
    totalClientesCount,
    lowStockCount,
    recentSales,
    lowStockVariants,
  ] = await Promise.all([
    db.venta.aggregate({
      _sum: { total: true },
    }),
    db.venta.count(),
    db.cliente.count(),
    db.variante.count({
      where: { stock: { lte: 5 } },
    }),
    db.venta.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vendedor: { select: { name: true } },
        cliente: { select: { nombre: true } },
      },
    }),
    db.variante.findMany({
      where: { stock: { lte: 5 } },
      take: 5,
      include: {
        producto: { select: { nombre: true } },
      },
      orderBy: { stock: 'asc' },
    }),
  ]);

  const totalFacturado = totalVentasAggregate._sum.total || 0;

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">¡Hola, {session.user?.name}!</h1>
        <p className="text-sm text-zinc-400 mt-1">Acá tenés un resumen del estado actual de tu negocio.</p>
      </div>

      {/* Grid de Tarjetas de Estadísticas */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Facturado */}
        <div className="glass-card rounded-2xl p-6 glow-purple">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total Facturado</span>
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400 border border-violet-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">
              ${totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Histórico facturado en pesos</p>
          </div>
        </div>

        {/* Ventas Registradas */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Ventas Totales</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">{totalVentasCount}</span>
            <p className="text-xs text-zinc-500 mt-1">Ventas realizadas con éxito</p>
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Clientes CRM</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">{totalClientesCount}</span>
            <p className="text-xs text-zinc-500 mt-1">Clientes cargados en el sistema</p>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Alertas de Stock</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">{lowStockCount}</span>
            <p className="text-xs text-zinc-500 mt-1">Variantes con stock bajo (≤ 5)</p>
          </div>
        </div>
      </div>

      {/* Grid de Secciones */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Últimas Ventas */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Últimas Ventas</h3>
              <Link href="/admin/ventas" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                Ver todo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">No hay ventas registradas todavía.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentSales.map((venta) => (
                  <div key={venta.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {venta.cliente?.nombre || 'Cliente Ocasional'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Por {venta.vendedor.name} • {new Date(venta.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-white">
                        ${venta.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas de Stock Detalle */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Productos con Stock Crítico</h3>
              <Link href="/admin/productos" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                Ver stock <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {lowStockVariants.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">Todos los productos tienen buen nivel de stock. 🎉</p>
            ) : (
              <div className="divide-y divide-white/5">
                {lowStockVariants.map((variante) => (
                  <div key={variante.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{variante.producto.nombre}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Variante: {variante.nombre}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        variante.stock === 0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {variante.stock} disp.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
