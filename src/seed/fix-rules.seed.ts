import { PrismaClient, ProofViewKey } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding missing Price Engine rules (PHOTO_VIDEO, COA_INCLUDED)...');

  const config = await prisma.priceEngineConfig.findUnique({
    where: { sport: 'Football' },
  });

  if (!config) {
    console.error('❌ Football config not found. Run main seed first.');
    return;
  }

  // 1. Add PHOTO_VIDEO Group
  await prisma.proofMultiplierGroup.upsert({
    where: { configId_proofType: { configId: config.id, proofType: 'PHOTO_VIDEO' } },
    update: {},
    create: {
      configId: config.id,
      proofType: 'PHOTO_VIDEO',
      rules: {
        create: [{ viewKey: ProofViewKey.FULL_VIEW, multiplier: 1.8 }],
      },
    },
  });

  // 2. Add COA_INCLUDED Auth
  await prisma.authMultiplier.upsert({
    where: { configId_companyKey: { configId: config.id, companyKey: 'COA_INCLUDED' } },
    update: { multiplier: 1.2 },
    create: {
      configId: config.id,
      companyKey: 'COA_INCLUDED',
      multiplier: 1.2,
    },
  });

  console.log('✅ Rules seeded successfully.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
