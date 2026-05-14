import {
  PrismaClient,
  FileAs,
  FileContext,
  FileModule,
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
  console.log('🧪 Starting Full Fledged Listing Creation Test...');

  // 1. Get Test User (Customer)
  const user = await prisma.user.findUnique({
    where: { email: 'user@sullerk.com' },
    include: { customer: true },
  });

  if (!user || !user.customer) {
    console.error('❌ Test user not found. Run user seed first.');
    return;
  }

  console.log(`👤 Testing with user: ${user.email} (ID: ${user.id})`);

  // 2. Create Dummy Pending Files
  console.log('📂 Creating dummy pending files...');
  const photoFile = await prisma.file.create({
    data: {
      url: 'http://localhost:8989/api/v1/files/test-photo.webp',
      key: 'test/photo',
      name: 'item.jpg',
      purpose: FileAs.PHOTOS,
      uploadedById: user.id,
      isPending: true,
      module: FileModule.LISTING,
      context: FileContext.CREATE,
    },
  });

  const proofFile = await prisma.file.create({
    data: {
      url: 'http://localhost:8989/api/v1/files/test-proof.webp',
      key: 'test/proof',
      name: 'proof.jpg',
      purpose: FileAs.PROOF_PHOTO,
      uploadedById: user.id,
      isPending: true,
      module: FileModule.LISTING,
      context: FileContext.CREATE,
    },
  });

  // 3. Initialize Services
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

  // 4. Create Listing Data
  const listingDto: any = {
    sport: 'Football',
    league: 'Premier League',
    teamOrCountry: 'Manchester United',
    playerOrManagerName: 'Marcus Rashford',
    category: ListingCategory.SHIRT,
    title: 'Test Signed Jersey',
    seasonOrYear: '2023/24',
    description: 'A test listing created by automated script.',
    signatureType: SignatureKey.FULL,
    photoProofType: ProofViewKey.FULL_VIEW_ATHLETE,
    coaStatus: COAStatus.COA_INCLUDED,
    appliedHonours: ['Premier League'],
    photos: [{ fileId: photoFile.id, url: photoFile.url }],
    photoProofs: [{ fileId: proofFile.id, url: proofFile.url }],
  };

  // 5. Execute Create
  console.log('📝 Calling ListingService.create()...');
  try {
    const result = await listingService.create(listingDto, user.id);

    console.log('✅ Listing Created Successfully!');
    console.log('📊 Calculation Results:');
    console.log(`   - Calculated Base Price: £${result.calculatedBasePrice}`);
    console.log(`   - Display Price: £${result.displayPrice}`);
    console.log(`   - Breakdown:`, JSON.stringify(result.priceBreakdown, null, 2));

    // 6. Verify Log Entry
    const log = await prisma.priceCalculationLog.findFirst({
      where: { listingId: result.id },
    });
    if (log) {
      console.log('✅ Price Calculation Log generated.');
    } else {
      console.error('❌ Price Calculation Log missing!');
    }

    // 7. Verify File Status
    const updatedPhoto = await prisma.file.findUnique({ where: { id: photoFile.id } });
    if (updatedPhoto && !updatedPhoto.isPending && updatedPhoto.listingId === result.id) {
      console.log('✅ Pending files successfully attached and cleared.');
    } else {
      console.error('❌ File status update failed!');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
