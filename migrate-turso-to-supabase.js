const { createClient } = require('@libsql/client');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient();

function toBool(val, defaultVal = false) {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
  return defaultVal;
}

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toFloat(val, defaultVal = 0) {
  if (val === null || val === undefined) return defaultVal;
  const num = parseFloat(val);
  return isNaN(num) ? defaultVal : num;
}

function toInt(val, defaultVal = 0) {
  if (val === null || val === undefined) return defaultVal;
  const num = parseInt(val, 10);
  return isNaN(num) ? defaultVal : num;
}

async function main() {
  console.log('🚀 Iniciando migración de Turso a Supabase PostgreSQL...');

  // 1. User
  console.log('📦 Migrando Users...');
  const usersRes = await turso.execute('SELECT * FROM "User"');
  for (const row of usersRes.rows) {
    await prisma.user.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        password: row.password ? String(row.password) : null,
        role: String(row.role || 'VENDEDOR'),
        activo: toBool(row.activo, true),
        imagen: row.imagen ? String(row.imagen) : null,
        createdAt: toDate(row.createdAt) || new Date(),
        ultimaLecturaNotif: toDate(row.ultimaLecturaNotif),
      },
    });
  }
  console.log(`✅ Users migrados: ${usersRes.rows.length}`);

  // 2. ProductoGrupo
  console.log('📦 Migrando ProductoGrupos...');
  const gruposRes = await turso.execute('SELECT * FROM "ProductoGrupo"');
  for (const row of gruposRes.rows) {
    await prisma.productoGrupo.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        nombre: String(row.nombre),
        descripcion: row.descripcion ? String(row.descripcion) : null,
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ ProductoGrupos migrados: ${gruposRes.rows.length}`);

  // 3. ProductoCategoria
  console.log('📦 Migrando ProductoCategorias...');
  const catRes = await turso.execute('SELECT * FROM "ProductoCategoria"');
  for (const row of catRes.rows) {
    await prisma.productoCategoria.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        grupoId: String(row.grupoId),
        nombre: String(row.nombre),
        descripcion: row.descripcion ? String(row.descripcion) : null,
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ ProductoCategorias migradas: ${catRes.rows.length}`);

  // 4. Producto
  console.log('📦 Migrando Productos...');
  const prodRes = await turso.execute('SELECT * FROM "Producto"');
  for (const row of prodRes.rows) {
    await prisma.producto.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        nombre: String(row.nombre),
        descripcion: row.descripcion ? String(row.descripcion) : null,
        categoriaId: row.categoriaId ? String(row.categoriaId) : null,
        activo: toBool(row.activo, true),
        imagen: row.imagen ? String(row.imagen) : null,
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ Productos migrados: ${prodRes.rows.length}`);

  // 5. Variante
  console.log('📦 Migrando Variantes...');
  const varRes = await turso.execute('SELECT * FROM "Variante"');
  for (const row of varRes.rows) {
    await prisma.variante.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        productoId: String(row.productoId),
        nombre: String(row.nombre),
        precio: toFloat(row.precio),
        precioUsd: toFloat(row.precioUsd),
        stock: toInt(row.stock),
        sku: row.sku ? String(row.sku) : null,
        createdAt: toDate(row.createdAt) || new Date(),
      },
    });
  }
  console.log(`✅ Variantes migradas: ${varRes.rows.length}`);

  // 6. Cliente
  console.log('📦 Migrando Clientes...');
  const cliRes = await turso.execute('SELECT * FROM "Cliente"');
  for (const row of cliRes.rows) {
    await prisma.cliente.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        nombre: String(row.nombre),
        telefono: row.telefono ? String(row.telefono) : null,
        email: row.email ? String(row.email) : null,
        notas: row.notas ? String(row.notas) : null,
        imagen: row.imagen ? String(row.imagen) : null,
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ Clientes migrados: ${cliRes.rows.length}`);

  // 7. CajaSession
  console.log('📦 Migrando CajaSessions...');
  const cajaRes = await turso.execute('SELECT * FROM "CajaSession"');
  for (const row of cajaRes.rows) {
    await prisma.cajaSession.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        usuarioId: String(row.usuarioId),
        saldoInicial: toFloat(row.saldoInicial),
        saldoInicialUsd: toFloat(row.saldoInicialUsd),
        saldoFinal: row.saldoFinal !== null ? toFloat(row.saldoFinal) : null,
        saldoFinalUsd: row.saldoFinalUsd !== null ? toFloat(row.saldoFinalUsd) : null,
        diferencia: row.diferencia !== null ? toFloat(row.diferencia) : null,
        diferenciaUsd: row.diferenciaUsd !== null ? toFloat(row.diferenciaUsd) : null,
        estado: String(row.estado || 'ABIERTA'),
        fechaApertura: toDate(row.fechaApertura) || new Date(),
        fechaCierre: toDate(row.fechaCierre),
        notas: row.notas ? String(row.notas) : null,
      },
    });
  }
  console.log(`✅ CajaSessions migradas: ${cajaRes.rows.length}`);

  // 8. CajaMovimiento
  console.log('📦 Migrando CajaMovimientos...');
  const cajaMovRes = await turso.execute('SELECT * FROM "CajaMovimiento"');
  for (const row of cajaMovRes.rows) {
    await prisma.cajaMovimiento.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        cajaId: String(row.cajaId),
        tipo: String(row.tipo),
        moneda: String(row.moneda || 'PYG'),
        monto: toFloat(row.monto),
        descripcion: String(row.descripcion),
        createdAt: toDate(row.createdAt) || new Date(),
      },
    });
  }
  console.log(`✅ CajaMovimientos migrados: ${cajaMovRes.rows.length}`);

  // 9. Venta
  console.log('📦 Migrando Ventas...');
  const ventaRes = await turso.execute('SELECT * FROM "Venta"');
  for (const row of ventaRes.rows) {
    await prisma.venta.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        vendedorId: String(row.vendedorId),
        clienteId: row.clienteId ? String(row.clienteId) : null,
        cajaId: row.cajaId ? String(row.cajaId) : null,
        notas: row.notas ? String(row.notas) : null,
        total: toFloat(row.total),
        metodoPago: String(row.metodoPago || 'EFECTIVO'),
        monedaCobro: String(row.monedaCobro || 'PYG'),
        cotizacionUsd: row.cotizacionUsd !== null ? toFloat(row.cotizacionUsd) : null,
        estado: String(row.estado || 'COMPLETADA'),
        createdAt: toDate(row.createdAt) || new Date(),
      },
    });
  }
  console.log(`✅ Ventas migradas: ${ventaRes.rows.length}`);

  // 10. VentaItem
  console.log('📦 Migrando VentaItems...');
  const ventaItemRes = await turso.execute('SELECT * FROM "VentaItem"');
  for (const row of ventaItemRes.rows) {
    await prisma.ventaItem.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        ventaId: String(row.ventaId),
        varianteId: row.varianteId ? String(row.varianteId) : null,
        cantidad: toInt(row.cantidad),
        precio: toFloat(row.precio),
      },
    });
  }
  console.log(`✅ VentaItems migrados: ${ventaItemRes.rows.length}`);

  // 11. GastoCategoria
  console.log('📦 Migrando GastoCategorias...');
  const gastoCatRes = await turso.execute('SELECT * FROM "GastoCategoria"');
  for (const row of gastoCatRes.rows) {
    await prisma.gastoCategoria.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        nombre: String(row.nombre),
        descripcion: row.descripcion ? String(row.descripcion) : null,
        createdAt: toDate(row.createdAt) || new Date(),
      },
    });
  }
  console.log(`✅ GastoCategorias migradas: ${gastoCatRes.rows.length}`);

  // 12. Gasto
  console.log('📦 Migrando Gastos...');
  const gastoRes = await turso.execute('SELECT * FROM "Gasto"');
  for (const row of gastoRes.rows) {
    await prisma.gasto.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        categoriaId: String(row.categoriaId),
        cajaId: row.cajaId ? String(row.cajaId) : null,
        usuarioId: String(row.usuarioId),
        moneda: String(row.moneda || 'PYG'),
        monto: toFloat(row.monto),
        descripcion: String(row.descripcion),
        fecha: toDate(row.fecha) || new Date(),
      },
    });
  }
  console.log(`✅ Gastos migrados: ${gastoRes.rows.length}`);

  // 13. Compra
  console.log('📦 Migrando Compras...');
  const compraRes = await turso.execute('SELECT * FROM "Compra"');
  for (const row of compraRes.rows) {
    await prisma.compra.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        usuarioId: String(row.usuarioId),
        cajaId: row.cajaId ? String(row.cajaId) : null,
        proveedor: row.proveedor ? String(row.proveedor) : null,
        moneda: String(row.moneda || 'PYG'),
        total: toFloat(row.total),
        notas: row.notas ? String(row.notas) : null,
        fecha: toDate(row.fecha) || new Date(),
      },
    });
  }
  console.log(`✅ Compras migradas: ${compraRes.rows.length}`);

  // 14. CompraItem
  console.log('📦 Migrando CompraItems...');
  const compraItemRes = await turso.execute('SELECT * FROM "CompraItem"');
  for (const row of compraItemRes.rows) {
    await prisma.compraItem.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        compraId: String(row.compraId),
        varianteId: row.varianteId ? String(row.varianteId) : null,
        cantidad: toInt(row.cantidad),
        costoUnit: toFloat(row.costoUnit),
      },
    });
  }
  console.log(`✅ CompraItems migrados: ${compraItemRes.rows.length}`);

  // 15. PrecioLista
  console.log('📦 Migrando PrecioListas...');
  const precioListaRes = await turso.execute('SELECT * FROM "PrecioLista"');
  for (const row of precioListaRes.rows) {
    await prisma.precioLista.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        nombre: String(row.nombre),
        descripcion: row.descripcion ? String(row.descripcion) : null,
        tipo: String(row.tipo || 'GENERICA'),
        orden: toInt(row.orden),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ PrecioListas migradas: ${precioListaRes.rows.length}`);

  // 16. PrecioGrupo
  console.log('📦 Migrando PrecioGrupos...');
  const precioGrupoRes = await turso.execute('SELECT * FROM "PrecioGrupo"');
  for (const row of precioGrupoRes.rows) {
    await prisma.precioGrupo.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        listaId: String(row.listaId),
        nombre: String(row.nombre),
        orden: toInt(row.orden),
        createdAt: toDate(row.createdAt) || new Date(),
      },
    });
  }
  console.log(`✅ PrecioGrupos migrados: ${precioGrupoRes.rows.length}`);

  // 17. PrecioItem
  console.log('📦 Migrando PrecioItems...');
  const precioItemRes = await turso.execute('SELECT * FROM "PrecioItem"');
  for (const row of precioItemRes.rows) {
    await prisma.precioItem.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        lista: String(row.lista),
        listaId: row.listaId ? String(row.listaId) : null,
        grupoId: row.grupoId ? String(row.grupoId) : null,
        nombre: String(row.nombre),
        precio: toFloat(row.precio),
        moneda: String(row.moneda || 'PYG'),
        cantidad: row.cantidad !== null ? toFloat(row.cantidad) : null,
        costoGs: row.costoGs !== null ? toFloat(row.costoGs) : null,
        costoUsd: row.costoUsd !== null ? toFloat(row.costoUsd) : null,
        lugar: row.lugar ? String(row.lugar) : null,
        agotado: toBool(row.agotado, false),
        pendiente: row.pendiente ? String(row.pendiente) : null,
        notas: row.notas ? String(row.notas) : null,
        orden: toInt(row.orden),
        montoUsd: toFloat(row.montoUsd),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ PrecioItems migrados: ${precioItemRes.rows.length}`);

  // 18. Notificacion
  console.log('📦 Migrando Notificaciones...');
  const notifRes = await turso.execute('SELECT * FROM "Notificacion"');
  for (const row of notifRes.rows) {
    await prisma.notificacion.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        tipo: String(row.tipo),
        titulo: String(row.titulo),
        mensaje: String(row.mensaje),
        link: String(row.link),
        createdAt: toDate(row.createdAt) || new Date(),
      },
    });
  }
  console.log(`✅ Notificaciones migradas: ${notifRes.rows.length}`);

  // 19. CalendarToken & CalendarEvent
  console.log('📦 Migrando CalendarTokens & Events...');
  const tokRes = await turso.execute('SELECT * FROM "CalendarToken"');
  for (const row of tokRes.rows) {
    await prisma.calendarToken.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        userId: String(row.userId),
        accessToken: String(row.accessToken),
        refreshToken: row.refreshToken ? String(row.refreshToken) : null,
        expiresAt: toDate(row.expiresAt),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  const evRes = await turso.execute('SELECT * FROM "CalendarEvent"');
  for (const row of evRes.rows) {
    await prisma.calendarEvent.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        googleId: row.googleId ? String(row.googleId) : null,
        titulo: String(row.titulo),
        descripcion: row.descripcion ? String(row.descripcion) : null,
        color: String(row.color || 'violeta'),
        start: String(row.start),
        end: String(row.end),
        todoElDia: toBool(row.todoElDia, false),
        recordatorio: toBool(row.recordatorio, false),
        createdAt: toDate(row.createdAt) || new Date(),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ CalendarTokens: ${tokRes.rows.length}, CalendarEvents: ${evRes.rows.length}`);

  // 20. Configuracion
  console.log('📦 Migrando Configuracion...');
  const cfgRes = await turso.execute('SELECT * FROM "Configuracion"');
  for (const row of cfgRes.rows) {
    await prisma.configuracion.upsert({
      where: { id: String(row.id) },
      update: {},
      create: {
        id: String(row.id),
        cotizacionUsd: toFloat(row.cotizacionUsd, 7500),
        ticketHabilitado: toBool(row.ticketHabilitado, true),
        ticketEmpresa: row.ticketEmpresa ? String(row.ticketEmpresa) : 'Sistema Keranai',
        ticketContacto: row.ticketContacto ? String(row.ticketContacto) : 'keranai.com',
        appLogo: row.appLogo ? String(row.appLogo) : null,
        appName: String(row.appName || 'Ventas Interno'),
        updatedAt: toDate(row.updatedAt) || new Date(),
      },
    });
  }
  console.log(`✅ Configuracion migrada: ${cfgRes.rows.length}`);

  console.log('🎉 ¡MIGRACIÓN DE TURSO A SUPABASE POSTGRESQL COMPLETADA CON ÉXITO!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
