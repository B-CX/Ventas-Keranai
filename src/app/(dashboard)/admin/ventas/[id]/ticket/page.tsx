import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function TicketPage({ params }: { params: { id: string } }) {
  const venta = await db.venta.findUnique({
    where: { id: params.id },
    include: {
      vendedor: { select: { name: true } },
      cliente: { select: { nombre: true, telefono: true } },
      items: {
        include: {
          variante: {
            include: { producto: { select: { nombre: true } } }
          }
        }
      }
    }
  });

  if (!venta) {
    notFound();
  }

  // Print layout optimized for 80mm thermal printers
  return (
    <div className="bg-white text-black min-h-screen p-4 flex justify-center font-mono text-sm">
      <div className="w-[80mm] bg-white print:w-full print:m-0 print:shadow-none shadow-lg border p-4 text-center">
        
        {/* Header */}
        <h1 className="text-xl font-bold uppercase mb-1">Sistema Keranai</h1>
        <p className="text-xs">Comprobante de Venta Interno</p>
        <p className="text-xs">No válido como factura fiscal</p>
        
        <div className="border-b-2 border-dashed border-black my-4"></div>

        {/* Info */}
        <div className="text-left text-xs space-y-1 mb-4">
          <p><strong>Fecha:</strong> {new Date(venta.createdAt).toLocaleString('es-AR')}</p>
          <p><strong>Ticket ID:</strong> {venta.id.slice(-6).toUpperCase()}</p>
          <p><strong>Atendió:</strong> {venta.vendedor.name}</p>
          <p><strong>Cliente:</strong> {venta.cliente?.nombre || 'Consumidor Final'}</p>
          <p><strong>Método Pago:</strong> {venta.metodoPago}</p>
          {venta.monedaCobro === 'USD' && (
            <p><strong>Moneda:</strong> USD (Cotización: ₲ {venta.cotizacionUsd?.toLocaleString('es-AR')})</p>
          )}
        </div>

        <div className="border-b-2 border-dashed border-black my-4"></div>

        {/* Items */}
        <table className="w-full text-left text-xs mb-4">
          <thead>
            <tr className="border-b border-black">
              <th className="py-1">CANT</th>
              <th className="py-1">DESCRIPCIÓN</th>
              <th className="py-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {venta.items.map(item => (
              <tr key={item.id}>
                <td className="py-1 align-top">{item.cantidad}x</td>
                <td className="py-1 pr-2">
                  {item.variante.producto.nombre} <br/>
                  <span className="text-[10px]">{item.variante.nombre}</span>
                </td>
                <td className="py-1 text-right align-top">
                  ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-b-2 border-dashed border-black my-4"></div>

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold uppercase mt-4">
          <span>Total:</span>
          <span>₲ {venta.total.toLocaleString('es-AR')}</span>
        </div>
        
        {venta.monedaCobro === 'USD' && venta.cotizacionUsd && (
          <div className="flex justify-between items-center text-sm font-bold mt-1 text-black/70">
            <span>Total USD:</span>
            <span>$ {(venta.total / venta.cotizacionUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-xs text-center">
          <p>¡Gracias por su compra!</p>
          <p className="mt-1 text-[10px]">keranai.com</p>
        </div>

      </div>

      {/* Print Button (Hidden in Print Mode) */}
      <div className="fixed bottom-8 right-8 print:hidden">
        <button 
          className="bg-black text-white px-6 py-3 rounded-full shadow-2xl font-bold hover:scale-105 transition"
          dangerouslySetInnerHTML={{ __html: 'Imprimir Ticket' }}
        />
      </div>
      {/* Script inline to handle button click safely in Next.js App Router Server Component */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelector('button').addEventListener('click', () => window.print());
      `}} />
    </div>
  );
}
