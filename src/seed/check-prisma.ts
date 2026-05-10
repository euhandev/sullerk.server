import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log('Available Prisma models:');
const keys = Object.keys(prisma).filter((k) => !k.startsWith('$') && !k.startsWith('_'));
console.log(keys.join(', '));
prisma.$disconnect();
