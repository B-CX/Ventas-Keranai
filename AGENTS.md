<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment & Architecture (Vercel + Turso)
- **Database**: This project uses Turso (cloud SQLite) via `@libsql/client` and `@prisma/adapter-libsql`. Do not use MySQL or raw SQLite file in production.
- **Vercel Invariants**: 
  - `package.json` MUST contain `"postinstall": "prisma generate"` to avoid PrismaClientInitializationError due to Vercel caching.
  - `.npmrc` MUST contain `legacy-peer-deps=true` to bypass ERESOLVE errors during Vercel builds.
- **Repository Hygiene**: NEVER commit backup folders (e.g. copies of the project) into the Git repository. The Next.js compiler eagerly traverses all directories and will type-check broken/duplicate components, causing persistent build failures.

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

## Flujo de Trabajo: Despliegue Seguro a Hostinger (hPanel)
Cuando el usuario pida "desplegar", "actualizar en Hostinger", o arreglar bugs de producción en Hostinger, NO subas archivos `.env.production` directamente en un `.zip` ni hagas commit de credenciales a GitHub (el repo es público). El sistema de Hostinger bloqueará la compilación si encuentra contraseñas comprimidas.
Sigue estrictamente este flujo para evadir el bloqueo:
0. CRÍTICO: Pídele siempre al usuario las variables de entorno configuradas en Vercel (ej. `AUTH_GOOGLE_ID`, `NEXTAUTH_SECRET`, APIs externas) o lee el `.env` local para garantizar que incluyas absolutamente TODAS las credenciales.
1. Crea un script temporal local `create-env.js` que utilice `fs.writeFileSync` para generar el archivo `.env.production` y `.env` con las variables y contraseñas necesarias.
2. Modifica temporalmente el `package.json` agregando `node create-env.js && ` al inicio del script `postinstall`.
3. Crea un archivo ZIP llamado `hostinger-deploy-auto.zip` usando `git archive` que contenga estas modificaciones temporales, por ejemplo:
   `git add -f create-env.js package.json && git commit -m "temp" && git archive -o hostinger-deploy-auto.zip HEAD && git reset HEAD~1 && git restore package.json`
4. Usa la herramienta MCP `hosting_deployJsApplication` para desplegar el `hostinger-deploy-auto.zip`. 
5. Elimina los archivos temporales (`create-env.js` y el `.zip`).
6. Monitorea el estado de compilación usando `hosting_listJsDeployments`. Hostinger ejecutará el script `postinstall`, generando las contraseñas internamente y completando el despliegue de forma exitosa y segura.

## Flujo de Trabajo: Actualizaciones de Prisma (EPERM Error)
- **Problema de bloqueo en Windows:** Si necesitas actualizar el esquema de Prisma (`schema.prisma`), **NUNCA** corras `npx prisma generate` si el servidor de Next.js (`npm run dev`) está en ejecución. Windows bloqueará el archivo `.node` lanzando un error `EPERM`.
- **Solución obligatoria:** Siempre busca y mata el proceso de Node que está usando el puerto 3000 antes de ejecutar la migración y regenerar el cliente de Prisma. Luego, vuelve a arrancar el servidor en segundo plano.

## Estándar de UI: Subida de Imágenes
- Todas las imágenes subidas por el usuario (Fotos de perfil, Logos, Productos, Clientes) deben procesarse de forma estricta en el cliente (frontend) antes de enviarse al servidor.
- **Formato obligatorio:** Usar un `canvas` en JavaScript para redimensionar la imagen a un máximo de `1024x1024` píxeles, recortarla en una proporción cuadrada (`1:1`) centrándola, y finalmente exportarla a `Base64` como `image/webp` con un 85% de calidad (`0.85`).
- Esto garantiza que la base de datos SQLite no colapse por el peso excesivo de archivos originales.

## Estándar de UI: Visualización de Imágenes (Lightbox)
- Siempre que se listen imágenes en miniatura o avatares de perfil en la aplicación (tablas, listas, perfiles), se debe implementar la capacidad de ampliar la imagen a su tamaño original.
- **Comportamiento:** Al hacer clic en la miniatura, la imagen debe abrirse en un componente superpuesto (Lightbox) centrado, con un fondo oscuro y difuminado (`backdrop-blur`), permitiendo cerrarlo al hacer clic fuera de la imagen o en un botón 'X'.

## Flujo de Trabajo: Migraciones en Producción (Turso)
- **Desincronización:** Cada vez que modifiques el archivo `schema.prisma` (agregar columnas o tablas), recuerda que ejecutar `npx prisma db push` **solo actualizará la base de datos local `dev.db`**.
- **Protocolo de Sincronización:** Para evitar errores 500 en Vercel y Hostinger, SIEMPRE debes actualizar la base de datos de Turso manualmente y **nunca escribas el SQL de memoria**.
- **Solución Estricta:** 
  1. Utiliza Prisma para generar el SQL exacto del parche ejecutando este comando:
     `npx prisma migrate diff --from-url file:./dev.db --to-schema-datamodel prisma/schema.prisma --script`
  2. Copia exactamente el código SQL que te devuelve ese comando.
  3. Crea un script temporal de Node.js que lea `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` desde `.env.production` y use `@libsql/client` para ejecutar el SQL generado mediante `client.executeMultiple()` (o comandos individuales).
  4. Ejecuta el script y luego bórralo.

## Estándar de Código: Componentes de React
- **Antipatrón Crítico:** NUNCA definas un componente de React dentro del cuerpo de otro componente de React. Esto causa que el componente interno se desmonte y vuelva a montar en cada renderizado del padre, provocando la pérdida de foco en inputs y un rendimiento terrible.
- **Solución Obligatoria:** Todos los componentes hijos (por ejemplo, sub-componentes como celdas de tablas, modales o filas) deben definirse a nivel de módulo (fuera de la función principal) o en su propio archivo, y deben recibir toda la data o callbacks que necesiten a través de `props`.

## Estándar de Arquitectura: Resiliencia ante APIs Externas
- Nunca diseñes una funcionalidad core de la aplicación (como el Calendario) dependiendo 100% de una API externa (ej. Google, APIs de terceros) sin un "fallback" local.
- **Regla:** Todos los datos deben guardarse prioritariamente en la base de datos propia (Turso/SQLite). Las integraciones externas deben tratarse como complementos de sincronización opcionales (sincronización en segundo plano). Si la API externa falla o no está conectada, la aplicación debe seguir funcionando con los datos locales.

## Estándar de Seguridad: Control de Accesos (RBAC) y UI Degradable
- Cuando se solicite dar acceso a un rol inferior (ej. `VENDEDOR`) a una vista de `ADMIN` "solo para ver":
  1. **Frontend (Degradación Elegante):** La UI debe reutilizar el mismo componente, pero deshabilitando los `inputs` (`disabled={!isAdmin}`) y ocultando los botones de acción (Crear/Editar/Eliminar).
  2. **Backend (Seguridad Estricta):** El endpoint de lectura (`GET`) debe permitir el acceso, pero los endpoints de mutación (`POST`, `PUT`, `DELETE`) deben verificar explícitamente el rol y retornar `401 No autorizado` si no es Admin.

## Estándar de Código: Next.js App Router y NextAuth
- **Antipatrón Crítico:** Llamar a `await auth();` dentro de un bloque `try / catch` en un API Route (`route.ts`). NextAuth lanza un `DynamicServerError` que, si es atrapado, hace que Next.js compile la ruta de forma estática como un error 500. Esto rompe la app en Producción.
- **Solución Obligatoria:** Todos los archivos `route.ts` que usen datos dinámicos, bases de datos o `auth()`, DEBEN incluir la directiva `export const dynamic = 'force-dynamic';` al inicio del archivo.
