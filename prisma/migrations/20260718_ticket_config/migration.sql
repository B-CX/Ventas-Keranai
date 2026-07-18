ALTER TABLE "Configuracion" ADD COLUMN "ticketHabilitado" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Configuracion" ADD COLUMN "ticketEmpresa" TEXT DEFAULT 'Sistema Keranai';
ALTER TABLE "Configuracion" ADD COLUMN "ticketContacto" TEXT DEFAULT 'keranai.com';
