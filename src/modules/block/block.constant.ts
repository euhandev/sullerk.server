import { Prisma } from '@prisma/client';

export const blockedUserInclude: Prisma.BlockedUserInclude = {
  blockedUser: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  },
};
