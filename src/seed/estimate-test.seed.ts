import {
  PrismaClient,
  ListingCategory,
  SignatureKey,
  ProofViewKey,
  COAStatus,
} from '@prisma/client';
import { ListingService } from '../modules/listing/listing.service';
import { PriceEngineService } from '../modules/price-engine/price-engine.service';
import { PrismaService } from '../helper/prisma.service';
import { FileService } from '../helper/file.service';
import { ConfigService } from '../config/config.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Optimized Pricing Logic (Multiplicative + Hierarchy)...');

  const prismaService = new PrismaService();
  const configService = new ConfigService();
  const fileService = new FileService(configService);
  const priceEngine = new PriceEngineService(prismaService);
  const listingService = new ListingService(
    prismaService,
    fileService,
    new EventEmitter2(),
    priceEngine,
    configService,
  );

  const testCases = [
    {
      name: 'Shirt with Both Proofs (Photo + Video) + COA Fallback',
      data: {
        sport: 'Football',
        category: ListingCategory.SHIRT,
        signatureType: SignatureKey.FULL,
        photoProofType: ProofViewKey.FULL_VIEW,
        videoProofType: ProofViewKey.FULL_VIEW,
        coaStatus: COAStatus.COA_INCLUDED, // Should use the fallback
        companyAuthentication: 'NONE',
      },
    },
    {
      name: 'Card with Professional Auth (Hierarchy Test)',
      data: {
        sport: 'Football',
        category: ListingCategory.CARD,
        signatureType: SignatureKey.PARTIAL,
        companyAuthentication: 'PSA', // Should override COA_INCLUDED
        coaStatus: COAStatus.COA_INCLUDED,
      },
    },
  ];

  for (const tc of testCases) {
    console.log(`\n📋 Case: ${tc.name}`);
    const result = await listingService.estimatePrice(tc.data as any);
    console.log(`💰 Final Price: £${result.finalPrice}`);
    console.log(
      `📊 Breakdown:`,
      JSON.stringify(
        result.breakdown.map((b: any) => ({ label: b.label, mult: b.multiplier })),
        null,
        2,
      ),
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
