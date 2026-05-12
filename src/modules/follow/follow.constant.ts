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

export const followerInclude: Prisma.FollowInclude = {
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
};

export const followingInclude: Prisma.FollowInclude = {
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
