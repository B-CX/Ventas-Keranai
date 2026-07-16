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
