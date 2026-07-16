// Script para importar datos a Turso desde el JSON exportado
// Ejecutar DESPUÉS de configurar TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env
// Uso: node prisma/import-to-turso.js

require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

async function importData() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('❌ Faltan variables de entorno: TURSO_DATABASE_URL y TURSO_AUTH_TOKEN');
    console.error('   Agrégalas al archivo .env y vuelve a intentarlo.');
    process.exit(1);
  }

  const dataPath = path.join(__dirname, 'data-export.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ No se encontró data-export.json. Ejecuta primero: node prisma/export-data.js');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📦 Importando datos exportados el ${data.exportedAt}...`);

  const client = createClient({ url: tursoUrl, authToken: tursoToken });

  // Disable foreign keys during import
  await client.execute('PRAGMA foreign_keys = OFF;');

  // Import in dependency order
  let count = 0;

  for (const user of data.users) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO User (id, name, email, password, role, activo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [user.id, user.name, user.email, user.password, user.role, user.activo ? 1 : 0, user.createdAt],
    });
    count++;
  }
  console.log(`   ✅ ${data.users.length} usuarios importados`);

  for (const p of data.productos) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO Producto (id, nombre, descripcion, categoria, activo, imagen, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.nombre, p.descripcion, p.categoria, p.activo ? 1 : 0, p.imagen, p.createdAt, p.updatedAt],
    });
    count++;
  }
  console.log(`   ✅ ${data.productos.length} productos importados`);

  for (const v of data.variantes) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO Variante (id, productoId, nombre, precio, precioUsd, stock, sku, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [v.id, v.productoId, v.nombre, v.precio, v.precioUsd, v.stock, v.sku, v.createdAt],
    });
    count++;
  }
  console.log(`   ✅ ${data.variantes.length} variantes importadas`);

  for (const c of data.clientes) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO Cliente (id, nombre, telefono, email, notas, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.nombre, c.telefono, c.email, c.notas, c.createdAt, c.updatedAt],
    });
    count++;
  }
  console.log(`   ✅ ${data.clientes.length} clientes importados`);

  for (const venta of data.ventas) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO Venta (id, vendedorId, clienteId, notas, total, estado, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [venta.id, venta.vendedorId, venta.clienteId, venta.notas, venta.total, venta.estado, venta.createdAt],
    });
    count++;
  }
  console.log(`   ✅ ${data.ventas.length} ventas importadas`);

  for (const item of data.ventaItems) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO VentaItem (id, ventaId, varianteId, cantidad, precio) VALUES (?, ?, ?, ?, ?)`,
      args: [item.id, item.ventaId, item.varianteId, item.cantidad, item.precio],
    });
    count++;
  }
  console.log(`   ✅ ${data.ventaItems.length} items de venta importados`);

  for (const pi of data.precioItems) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO PrecioItem (id, lista, nombre, precio, moneda, cantidad, costoGs, costoUsd, lugar, agotado, pendiente, orden, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [pi.id, pi.lista, pi.nombre, pi.precio, pi.moneda, pi.cantidad, pi.costoGs, pi.costoUsd, pi.lugar, pi.agotado ? 1 : 0, pi.pendiente, pi.orden, pi.createdAt, pi.updatedAt],
    });
    count++;
  }
  console.log(`   ✅ ${data.precioItems.length} items de precios importados`);

  await client.execute('PRAGMA foreign_keys = ON;');

  console.log(`\n🎉 Importación completada! ${count} registros totales importados a Turso.`);
  client.close();
}

importData().catch((e) => {
  console.error('❌ Error al importar:', e);
  process.exit(1);
});
