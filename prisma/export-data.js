// Script para exportar todos los datos del SQLite local a JSON
// Ejecutar con: node prisma/export-data.js
// Luego importar a Turso con: node prisma/import-to-turso.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Exportando datos del SQLite local...');

  const [users, productos, variantes, clientes, ventas, ventaItems, precioItems, calendarTokens] = await Promise.all([
    prisma.user.findMany(),
    prisma.producto.findMany(),
    prisma.variante.findMany(),
    prisma.cliente.findMany(),
    prisma.venta.findMany(),
    prisma.ventaItem.findMany(),
    prisma.precioItem.findMany(),
    prisma.calendarToken.findMany(),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    users,
    productos,
    variantes,
    clientes,
    ventas,
    ventaItems,
    precioItems,
    calendarTokens,
  };

  const outputPath = path.join(__dirname, 'data-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✅ Exportación completada:`);
  console.log(`   - ${users.length} usuarios`);
  console.log(`   - ${productos.length} productos`);
  console.log(`   - ${variantes.length} variantes`);
  console.log(`   - ${clientes.length} clientes`);
  console.log(`   - ${ventas.length} ventas`);
  console.log(`   - ${ventaItems.length} items de venta`);
  console.log(`   - ${precioItems.length} items de precios`);
  console.log(`   - ${calendarTokens.length} tokens de calendario`);
  console.log(`\n📄 Archivo guardado en: ${outputPath}`);

  await prisma.$disconnect();
}

exportData().catch((e) => {
  console.error('❌ Error al exportar:', e);
  prisma.$disconnect();
  process.exit(1);
});
