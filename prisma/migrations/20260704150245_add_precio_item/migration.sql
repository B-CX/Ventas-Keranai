-- CreateTable
CREATE TABLE "PrecioItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lista" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" REAL NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'PYG',
    "cantidad" REAL,
    "costoGs" REAL,
    "costoUsd" REAL,
    "lugar" TEXT,
    "agotado" BOOLEAN NOT NULL DEFAULT false,
    "pendiente" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
