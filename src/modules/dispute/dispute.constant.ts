import { Prisma } from '@prisma/client';

export const disputeFilterFields = ['status', 'type'];
export const disputeSearchFields = ['reason', 'details'];

export const disputeInclude: Prisma.DisputeInclude = {
  raisedBy: {
    select: {
      fullName: true,
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  },
  listing: {
    select: {
      id: true,
      title: true,
      ownerId: true,
    },
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      buyerId: true,
      sellerId: true,
    },
  },
  resolvedBy: {
    select: {
      fullName: true,
    },
  },
};
