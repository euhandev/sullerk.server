import { PrismaClient, ListingStatus, ListingCategory, Role, Status } from '@prisma/client';

const prisma = new PrismaClient();

const IMAGE_URL =
  'https://images.pexels.com/photos/37407358/pexels-photo-37407358.jpeg?_gl=1*vi7ad9*_ga*NjgxMzU2NjkuMTc3ODY0MTMzMQ..*_ga_8JE65Q40S6*czE3Nzg2NDEzMzEkbzEkZzEkdDE3Nzg2NDEzNTgkajMzJGwwJGgw';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create or get sample users/customers
  const usersData = [
    {
      username: 'johndoe',
      email: 'john@example.com',
      fullName: 'John Doe',
    },
    {
      username: 'janessmith',
      email: 'jane@example.com',
      fullName: 'Jane Smith',
    },
    {
      username: 'mikebrown',
      email: 'mike@example.com',
      fullName: 'Mike Brown',
    },
  ];

  const customers = [];

  for (const userData of usersData) {
    let user = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          role: Role.CUSTOMER,
          status: Status.ACTIVE,
          customer: {
            create: {
              fullName: userData.fullName,
              address: '123 Sport St',
              city: 'London',
              country: 'UK',
              balance: 1000.0,
            },
          },
        },
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: user.id },
    });
    if (customer) {
      customers.push(customer);
    }
  }

  console.log(`✅ Created/Found ${customers.length} customers.`);

  // 2. Create 10 listings
  const listingsData = [
    {
      title: 'Messi Signed Jersey',
      sport: 'Football',
      team: 'Argentina',
      category: ListingCategory.SHIRT,
      price: 500,
    },
    {
      title: 'LeBron Lakers Jersey',
      sport: 'Basketball',
      team: 'Lakers',
      category: ListingCategory.SHIRT,
      price: 350,
    },
    {
      title: 'Vintage Cricket Bat',
      sport: 'Cricket',
      team: 'India',
      category: ListingCategory.OTHER,
      price: 200,
    },
    {
      title: 'Signed Boxing Gloves',
      sport: 'Boxing',
      team: 'N/A',
      category: ListingCategory.GLOVES,
      price: 150,
    },
    {
      title: 'Match Worn Boots',
      sport: 'Football',
      team: 'Real Madrid',
      category: ListingCategory.BOOTS,
      price: 450,
    },
    {
      title: 'Rare Basketball Card',
      sport: 'Basketball',
      team: 'Bulls',
      category: ListingCategory.CARD,
      price: 1000,
    },
    {
      title: 'World Cup Match Ball',
      sport: 'Football',
      team: 'Germany',
      category: ListingCategory.MATCH_BALL,
      price: 300,
    },
    {
      title: 'Autographed Photo',
      sport: 'Tennis',
      team: 'N/A',
      category: ListingCategory.SIGNED_PHOTO,
      price: 100,
    },
    {
      title: 'Rugby Team Shorts',
      sport: 'Rugby',
      team: 'England',
      category: ListingCategory.SHORTS,
      price: 80,
    },
    {
      title: 'Special Edition Jersey',
      sport: 'Football',
      team: 'Man City',
      category: ListingCategory.SHIRT,
      price: 250,
    },
  ];

  for (let i = 0; i < 10; i++) {
    const data = listingsData[i];
    const owner = customers[i % customers.length];

    await prisma.listing.create({
      data: {
        title: data.title,
        sport: data.sport,
        teamOrCountry: data.team,
        category: data.category,
        seasonOrYear: '2023-2024',
        description: `This is a high-quality ${data.title} for collectors and fans.`,
        initialPrice: data.price,
        displayPrice: data.price,
        status: ListingStatus.ACTIVE,
        ownerId: owner.id,
        photos: [
          { fileId: `seed-photo-${i}-1`, url: IMAGE_URL },
          { fileId: `seed-photo-${i}-2`, url: IMAGE_URL },
        ],
        isTradingEnable: true,
        allowOffers: true,
      },
    });
  }

  console.log('✅ Created 10 sample listings.');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
