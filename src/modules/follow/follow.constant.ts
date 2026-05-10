import { Prisma } from '@prisma/client';

export const followInclude: Prisma.FollowInclude = {
  follower: {
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
  following: {
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
