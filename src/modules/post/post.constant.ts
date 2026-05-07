export const postFilterFields = ['customerId', 'listingId'];

export const postSearchFields = ['description', 'aiAnalysis'];

export const postInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      user: {
        select: {
          avatar: true,
        },
      },
    },
  },
  listing: {
    include: {
      owner: {
        select: {
          fullName: true,
        },
      },
    },
  },
  _count: {
    select: {
      reactions: true,
      comments: true,
      reports: true,
      stars: true,
    },
  },
  pollOptions: true,
};
