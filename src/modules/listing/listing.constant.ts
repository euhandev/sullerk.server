export const listingFilterFields = [
  'sport',
  'teamOrCountry',
  'category',
  'kitType',
  'signatureType',
  'status',
  'ownerId',
  'coaStatus',
  'format',
];

export const listingSearchFields = [
  'title',
  'description',
  'playerOrManagerName',
  'teamOrCountry',
  'sport',
];

export const listingInclude = {
  owner: {
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
  _count: {
    select: {
      watchlists: true,
      starredListings: true,
      shares: true,
    },
  },
};
