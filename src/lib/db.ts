import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
  return new PrismaClient();
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
