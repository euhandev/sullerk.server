// prisma-extension.ts
import { PrismaClient } from '@prisma/client';

export const prismaWithExtensions = new PrismaClient().$extends({
  model: {
    user: {
      async isUserExists(contactNo: string) {
        return this.findUnique({ where: { contactNo } });
      },
      async isPasswordMatched(givenPassword: string, savedPassword: string) {
        const bcrypt = await import('bcrypt');
        return bcrypt.compare(givenPassword, savedPassword);
      },
    },
  },
});
