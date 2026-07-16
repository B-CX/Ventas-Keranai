-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Variante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "precioUsd" REAL NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Variante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Variante" ("createdAt", "id", "nombre", "precio", "productoId", "sku", "stock") SELECT "createdAt", "id", "nombre", "precio", "productoId", "sku", "stock" FROM "Variante";
DROP TABLE "Variante";
ALTER TABLE "new_Variante" RENAME TO "Variante";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
