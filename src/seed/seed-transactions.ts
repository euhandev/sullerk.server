import {
  PrismaClient,
  TransactionType,
  TransactionStatus,
  OrderStatus,
  WithdrawalStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const customerIds = [
    '69f8b61df01436c26495d83d',
    '69f8bd51c82a7af81f6c3d0d',
    '69fa9d752b29ec54b92810c5',
  ];

  console.log('Seeding transactions...');

  for (const customerId of customerIds) {
    // 1. Create 10 Orders and SALE_REVENUE / PURCHASE_DEBIT / PLATFORM_FEE
    for (let i = 1; i <= 4; i++) {
      const order = await prisma.order.create({
        data: {
          buyerId: customerIds[0],
          sellerId: customerId,
          listingId: '69f8bd51c82a7af81f6c3d0f', // Dummy listing ID if it exists
          totalAmount: 100 + i * 10,
          platformFee: 5 + i,
          sellerEarnings: 95 + i * 9,
          status: OrderStatus.COMPLETED,
          orderNumber: `ORD-SEED-${customerId.slice(-4)}-${i}`,
        },
      });

      // Sale Revenue for Seller
      await prisma.transaction.create({
        data: {
          customerId: order.sellerId,
          amount: order.sellerEarnings,
          type: TransactionType.SALE_REVENUE,
          status: TransactionStatus.COMPLETED,
          orderId: order.id,
          description: `Sale revenue for ${order.orderNumber}`,
        },
      });

      // Platform Fee for Seller
      await prisma.transaction.create({
        data: {
          customerId: order.sellerId,
          amount: -order.platformFee,
          type: TransactionType.PLATFORM_FEE,
          status: TransactionStatus.COMPLETED,
          orderId: order.id,
          description: `Platform fee for ${order.orderNumber}`,
        },
      });

      // Purchase Debit for Buyer
      await prisma.transaction.create({
        data: {
          customerId: order.buyerId,
          amount: -order.totalAmount,
          type: TransactionType.PURCHASE_DEBIT,
          status: TransactionStatus.COMPLETED,
          orderId: order.id,
          description: `Purchase debit for ${order.orderNumber}`,
        },
      });
    }

    // 2. Create 10 Withdrawals
    for (let i = 1; i <= 10; i++) {
      const withdrawal = await prisma.withdrawal.create({
        data: {
          customerId: customerId,
          amount: 50 + i * 5,
          status: i % 2 === 0 ? WithdrawalStatus.COMPLETED : WithdrawalStatus.PENDING,
          adminNote: i % 2 === 0 ? 'Processed' : 'Awaiting review',
        },
      });

      await prisma.transaction.create({
        data: {
          customerId: customerId,
          amount: -withdrawal.amount,
          type: TransactionType.WITHDRAWAL,
          status: i % 2 === 0 ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
          withdrawalId: withdrawal.id,
          description: `Withdrawal request #${withdrawal.id.slice(-4)}`,
        },
      });
    }
  }

  console.log('Seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
