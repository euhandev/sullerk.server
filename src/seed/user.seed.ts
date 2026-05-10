import { PrismaClient, Role, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  console.log('🚀 Seeding users...');

  // Create Admin
  const adminEmail = 'admin@sullerk.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'superadmin',
        password: password,
        role: Role.ADMIN,
        status: Status.ACTIVE,
        admin: {
          create: {
            fullName: 'Super Admin',
          },
        },
      },
    });
    console.log(`✅ Admin created: ${admin.email}`);
  } else {
    console.log(`⏩ Admin already exists: ${adminEmail}`);
  }

  // Create Customer
  const customerEmail = 'user@sullerk.com';
  const existingCustomer = await prisma.user.findUnique({ where: { email: customerEmail } });

  if (!existingCustomer) {
    const customer = await prisma.user.create({
      data: {
        email: customerEmail,
        username: 'testuser',
        password: password,
        role: Role.CUSTOMER,
        status: Status.ACTIVE,
        customer: {
          create: {
            fullName: 'Test User',
          },
        },
      },
    });
    console.log(`✅ Customer created: ${customer.email}`);
  } else {
    console.log(`⏩ Customer already exists: ${customerEmail}`);
  }

  console.log('🏁 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
