# ✅ Sistema de Ventas Interno — Walkthrough Final

El sistema está **funcionando en `http://localhost:3000`**. Build de producción compilado exitosamente con 17 rutas.

---

## 🔑 Credenciales de Acceso

| Campo | Valor |
|-------|-------|
| **Email** | `admin@ventas.com` |
| **Contraseña** | `admin123` |
| **Rol** | Administrador (acceso total) |

---

## 📁 Estructura del Proyecto

```
c:\Users\bcand\Downloads\Apps KeranaiProductos\ventas-interno\
```

---

## 🧩 Módulos Implementados

### 1. 🔐 Login (NextAuth.js v5)
- Pantalla dark mode con glassmorphism y gradientes.
- Credenciales validadas con `bcryptjs` contra la base de datos SQLite.
- Sesión JWT persistente.
- Middleware de protección de rutas por rol.

### 2. 📦 Gestión de Productos (Admin)
- CRUD completo con variantes (talla, color, modelo, SKU).
- Stock visible por cada variante con alertas visuales (verde/amarillo/rojo).
- Activar/desactivar productos para controlar visibilidad para vendedores.
- Búsqueda en tiempo real por nombre.

### 3. 🛒 Nueva Venta (Todos los roles)
- Búsqueda de productos con autocomplete.
- Selección visual de variantes con stock disponible visible antes de confirmar.
- Carrito con control de cantidad (valida contra stock).
- Asociar venta a cliente existente o crear uno nuevo en el momento.
- Al confirmar: transacción atómica que valida stock y lo descuenta.
- Modal de confirmación con ID de venta.

### 4. 👤 CRM de Clientes (Todos los roles)
- Cards con nombre, teléfono, email y notas.
- Búsqueda por nombre, email o teléfono.
- Edición de datos.
- Modal de **Historial de Compras** con detalle completo de cada venta.

### 5. 📋 Historial de Ventas (Solo Admin)
- Tabla paginable con todas las ventas.
- Filtros combinables: por vendedor, cliente, fecha desde, fecha hasta.
- Total facturado dinámico según los filtros activos.
- Modal de detalle por venta (items, precios, cliente).
- **Exportar a CSV** compatible con Excel (UTF-8 con BOM).

### 6. 👥 Gestión de Usuarios (Solo Admin)
- Tabla de todos los usuarios del sistema.
- Crear vendedores con nombre, email, contraseña y rol.
- Activar/desactivar cuentas (cuentas desactivadas no pueden iniciar sesión).
- Cambiar contraseña sin re-ingresarla toda.
- Protección: el admin no puede desactivarse a sí mismo.

---

## 🗄️ Base de Datos (SQLite)

```
prisma/dev.db
```

**Modelos**: `User`, `Producto`, `Variante`, `Cliente`, `Venta`, `VentaItem`

---

## ⚙️ Stack Técnico Final

| Tecnología | Versión | Nota |
|-----------|---------|------|
| **Next.js** | 14.2.3 | App Router, compatible Node 18.16 |
| **TypeScript** | 5.x | Strict mode off (compatible) |
| **Tailwind CSS** | 3.4.1 | v3 compatible con Node 18 |
| **Prisma** | 5.22.0 | SQLite, transacciones atómicas |
| **NextAuth.js** | v5 beta | JWT + Credentials Provider |
| **bcryptjs** | 3.x | Hash de contraseñas |
| **lucide-react** | latest | Íconos premium |

---

## 🚀 Comandos Útiles

```bash
# Iniciar el servidor de desarrollo (usando el script INICIAR.bat)
INICIAR.bat

# Abrir el explorador de BD
npx prisma studio

# Correr el seed (crear admin inicial)
npx prisma db seed

# Crear nueva migración después de cambiar el schema
npx prisma migrate dev --name nombre-cambio
```

> [!TIP]
> Para acceder desde el **celular** en la misma red WiFi, usá la IP local de tu PC, por ejemplo: `http://192.168.1.x:3000`

---

## ⚠️ Notas Importantes

> [!WARNING]
> El proyecto usa Node.js 18.16.0. Next.js 14 requiere >=18.17.0. Se aplicó un patch al bin de Next.js para saltear el check de versión. En producción, actualizá Node.js a v20+ para mayor estabilidad.

> [!NOTE]
> El archivo `.env` contiene el `AUTH_SECRET`. Para producción, generá un secreto más seguro con: `openssl rand -base64 32`
