<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment & Architecture (Vercel + Supabase PostgreSQL)
- **Database**: Este proyecto utiliza Supabase (Cloud PostgreSQL 17). No usar MySQL o SQLite en producción.
- **Prisma Configuration**: `prisma/schema.prisma` utiliza `provider = "postgresql"` con `url = env("DATABASE_URL")` (Pooler) y `directUrl = env("DIRECT_URL")` (Conexión directa).
- **Vercel Invariants**: 
  - `package.json` DEBE contener `"postinstall": "prisma generate"` para evitar PrismaClientInitializationError debido a la caché de Vercel.
  - `.npmrc` DEBE contener `legacy-peer-deps=true` para evitar errores ERESOLVE durante las compilaciones.
- **Repository Hygiene**: NUNCA hacer commit de carpetas de respaldo dentro del repositorio Git.

## Local Workflow (Google Drive)
- The primary workspace is inside a Google Drive folder (`g:\Mi unidad\...`). 
- Running `npm install` or `npm run dev` directly in Google Drive is extremely slow and causes file locks. 
- **Start command**: Always suggest or use `INICIAR.bat` to run the project. It copies the code to a local SSD (`C:\Users\bcand\ventas-app\ventas-interno`) and runs the server from there.

## Flujo de Trabajo: Actualizar y Respaldar
- Cuando el usuario solicite "Actualizar", "Guardar todo" o sincronizar el proyecto, debes seguir estrictamente este flujo:
  1. Hacer commit de todos los cambios locales en `C:\Users\bcand\ventas-app\ventas-interno`.
  2. Subirlos a GitHub (`git push origin main`).
  3. Copiar el estado actual a Google Drive ejecutando exactamente este comando en PowerShell:
     `robocopy "C:\Users\bcand\ventas-app\ventas-interno" "G:\Mi unidad\antigravity app proyecto\ventas-interno" /MIR /XD node_modules .next .git`
  4. Esto asegura que la próxima vez que el usuario ejecute `INICIAR.bat`, no se sobrescriban los cambios más recientes con versiones viejas.

## Flujo de Trabajo: Despliegue a Hostinger (hPanel)
Cuando el usuario pida "desplegar" o "actualizar en Hostinger", la aplicación debe subirse sin archivos de entorno locales.
1. Recuérdale al usuario que debe asegurarse de tener todas sus variables de entorno configuradas directamente en el panel de control de Hostinger.
2. Crea un archivo ZIP limpio a partir del último commit: `git archive -o hostinger-deploy-auto.zip HEAD`. (NO incluyas archivos `.env` ni scripts con credenciales como `create-env.js`, ya que Hostinger bloqueará el despliegue por motivos de seguridad).
3. Usa la herramienta MCP `hosting_deployJsApplication` para desplegar el `hostinger-deploy-auto.zip`.
4. Monitorea el estado usando `hosting_listJsDeployments`.
5. Finalmente, elimina el archivo temporal `hostinger-deploy-auto.zip`.

## Flujo de Trabajo: Actualizaciones de Prisma (EPERM Error)
- **Problema de bloqueo en Windows:** Si necesitas actualizar el esquema de Prisma (`schema.prisma`), **NUNCA** corras `npx prisma generate` si el servidor de Next.js (`npm run dev`) está en ejecución. Windows bloqueará el archivo `.node` lanzando un error `EPERM`.
- **Solución obligatoria:** Siempre busca y mata el proceso de Node que está usando el puerto 3000 antes de ejecutar la migración y regenerar el cliente de Prisma. Luego, vuelve a arrancar el servidor en segundo plano.

## Estándar de UI: Subida de Imágenes
- Todas las imágenes subidas por el usuario (Fotos de perfil, Logos, Productos, Clientes) deben procesarse de forma estricta en el cliente (frontend) antes de enviarse al servidor.
- **Formato obligatorio:** Usar un `canvas` en JavaScript para redimensionar la imagen a un máximo de `1024x1024` píxeles, recortarla en una proporción cuadrada (`1:1`) centrándola, y finalmente exportarla a `Base64` como `image/webp` con un 85% de calidad (`0.85`).
- Esto garantiza que la base de datos no colapse por el peso excesivo de archivos originales.

## Estándar de UI: Visualización de Imágenes (Lightbox)
- Siempre que se listen imágenes en miniatura o avatares de perfil en la aplicación (tablas, listas, perfiles), se debe implementar la capacidad de ampliar la imagen a su tamaño original.
- **Comportamiento:** Al hacer clic en la miniatura, la imagen debe abrirse en un componente superpuesto (Lightbox) centrado, con un fondo oscuro y difuminado (`backdrop-blur`), permitiendo cerrarlo al hacer clic fuera de la imagen o en un botón 'X'.

## Flujo de Trabajo: Migraciones en Producción (Supabase PostgreSQL)
- **Despliegue de Esquema**: Ejecutar `npx prisma db push` para sincronizar el modelo en `schema.prisma` con Supabase PostgreSQL.
- **Variables de Entorno**:
  - `DATABASE_URL`: Conexión mediante pooler (puerto 6543) para la ejecución en Vercel Serverless.
  - `DIRECT_URL`: Conexión directa (puerto 5432) para las herramientas de CLI de Prisma.

## Estándar de Código: Componentes de React
- **Antipatrón Crítico:** NUNCA definas un componente de React dentro del cuerpo de otro componente de React. Esto causa que el componente interno se desmonte y vuelva a montar en cada renderizado del padre, provocando la pérdida de foco en inputs y un rendimiento terrible.
- **Solución Obligatoria:** Todos los componentes hijos (por ejemplo, sub-componentes como celdas de tablas, modales o filas) deben definirse a nivel de módulo (fuera de la función principal) o en su propio archivo, y deben recibir toda la data o callbacks que necesiten a través de `props`.

## Estándar de Arquitectura: Resiliencia ante APIs Externas
- Nunca diseñes una funcionalidad core de la aplicación (como el Calendario) dependiendo 100% de una API externa (ej. Google, APIs de terceros) sin un "fallback" local.
- **Regla:** Todos los datos deben guardarse prioritariamente en la base de datos propia (Supabase/PostgreSQL). Las integraciones externas deben tratarse como complementos de sincronización opcionales (sincronización en segundo plano). Si la API externa falla o no está conectada, la aplicación debe seguir funcionando con los datos locales.

## Estándar de Arquitectura: Separación de Vistas por Rol
- **Antipatrón Crítico:** Reutilizar la misma página (ej. `/admin/recurso`) para `ADMIN` y `VENDEDOR` utilizando condicionales de renderizado como `if (isAdmin)` para ocultar componentes. Esto causa "saltos" en la UI y errores de hidratación/crashes fatales en Hostinger al evaluar el estado de carga de la sesión (`useSession`).
- **Solución Obligatoria:** Las vistas con diferencias sustanciales entre roles deben separarse en rutas distintas (ej. `/admin/calendario` y `/venta/calendario`). Los componentes de UI de cada ruta deben ser limpios y sin condicionales de sesión.

## Regla de Negocio: Permisos de Calendario y Google Sync
- Los usuarios con rol `VENDEDOR` tienen acceso completo (CRUD) para agendar, editar y eliminar eventos en el Calendario.
- **Sincronización:** Sin embargo, la integración con la API de Google Calendar está **estrictamente reservada** para el rol `ADMIN`. Los eventos creados por un `VENDEDOR` deben guardarse únicamente de manera interna en la base de datos (Supabase) sin invocar a Google.

## Estándar de Código: Next.js App Router y NextAuth
- **Antipatrón Crítico:** Llamar a `await auth();` dentro de un bloque `try / catch` en un API Route (`route.ts`). NextAuth lanza un `DynamicServerError` que, si es atrapado, hace que Next.js compile la ruta de forma estática como un error 500. Esto rompe la app en Producción.
- **Solución Obligatoria:** Todos los archivos `route.ts` que usen datos dinámicos, bases de datos o `auth()`, DEBEN incluir la directiva `export const dynamic = 'force-dynamic';` al inicio del archivo.

## Flujo de Trabajo: Configuración DNS en Hostinger (MCP)
- **Restricción de tipo CNAME (Error DNS:4005):** En la zona DNS de Hostinger, un registro de tipo `CNAME` para un subdominio (ej. `productos`) no puede coexistir con registros de tipo `A` o `AAAA` para el mismo nombre.
- **Protocolo de Actualización mediante MCP:**
  1. Verificar los registros existentes llamando a `DNS_getDNSRecordsV1`.
  2. Si existen registros conflictivos (`A` o `AAAA`), eliminarlos primero invocando `DNS_deleteDNSRecordsV1` especificando el parámetro `filters: [{ name: "<subdominio>", type: "A" }, { name: "<subdominio>", type: "AAAA" }]`.
  3. Agregar el registro `CNAME` invocando `DNS_updateDNSRecordsV1` con `overwrite: false`.

## Flujo de Trabajo: Supabase & Agent Skills
- **Instalación de Skills:** Al instalar skills de agentes mediante CLI, usar siempre la bandera `-y` (ejemplo: `npx -y skills add supabase/agent-skills`) para evitar bloqueos por confirmación interactiva.
- **Uso de Skills Locales:** Las habilidades instaladas en `.\.agents\skills\` (`supabase` y `supabase-postgres-best-practices`) deben consultarse para mejores prácticas de esquema, consultas SQL y RLS en Supabase.
- **Autenticación y Vinculación CLI:** Para ejecutar comandos de Supabase CLI de forma no interactiva (ej. `supabase link`), inicializar con `npx -y supabase init` y vincular pasando el token de acceso: `$env:SUPABASE_ACCESS_TOKEN="sbp_..." npx -y supabase link --project-ref <project_ref>`.
