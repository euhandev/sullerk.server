import { Prisma } from '@prisma/client';

export const transactionFilterFields = ['status', 'type', 'customerId'];
export const transactionSearchFields = ['description', 'id'];

export const transactionInclude: Prisma.TransactionInclude = {
  customer: {
    include: {
      user: {
        select: {
          username: true,
          email: true,
          avatar: true,
        },
      },
    },
  },
};
