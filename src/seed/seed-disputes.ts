import { PrismaClient, DisputeType, DisputeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const customers = await prisma.customer.findMany({ take: 3 });
  const listings = await prisma.listing.findMany({ take: 3 });
  const orders = await prisma.order.findMany({ take: 3 });

  if (customers.length === 0 || (listings.length === 0 && orders.length === 0)) {
    console.error('Not enough data to seed disputes. Please seed customers/listings/orders first.');
    return;
  }

  console.log('Seeding disputes...');

  const statuses = [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.RESOLVED];
  const types = [DisputeType.DISPUTE, DisputeType.REFUND];

  for (let i = 1; i <= 15; i++) {
    const customer = customers[i % customers.length];
    const status = statuses[i % statuses.length];
    const type = types[i % types.length];

    await prisma.dispute.create({
      data: {
        raisedById: customer.id,
        listingId: listings[i % listings.length]?.id,
        orderId: orders[i % orders.length]?.id,
        type: type,
        status: status,
        reason: `Seeded Dispute #${i} - ${type}`,
        details: `This is a detailed description for dispute number ${i}.`,
        createdAt: new Date(Date.now() - i * 3600000), // different times
      },
    });
  }

  console.log('Dispute seeding completed.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
