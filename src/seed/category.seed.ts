import { PrismaService } from '@/helper/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ReferralPathType } from '@prisma/client';

@Injectable()
export class CategorySeedingService implements OnModuleInit {
  private readonly logger = new Logger(CategorySeedingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('📚 Running CategorySeedingService for Oak Tree Learning Hub...');
    await this.seedCategories();
    this.logger.log('✅ Category seeding completed.');
  }

  async seedCategories() {
    const categoriesData = [
      {
        name: 'Wills Fundamentals',
        slug: 'wills-fundamentals',
        description:
          "Understand what a will is, the different types of wills, and why having a properly drafted will is essential – especially after remarriage to protect your children's inheritance.",
        order: 1,
        targetAudience: 'All segments',
        referralPath: ReferralPathType.ESTATE_PLANNING,
      },
      {
        name: 'Powers of Attorney',
        slug: 'powers-of-attorney',
        description:
          'Learn how Powers of Attorney protect you if you become incapacitated, the different types available (Health & Welfare, Property & Financial), and why setting this up early is crucial for peace of mind.',
        order: 2,
        targetAudience: 'All segments',
        referralPath: ReferralPathType.ESTATE_PLANNING,
      },
      {
        name: 'Trusts & Asset Protection',
        slug: 'trusts-asset-protection',
        description:
          'Discover how trusts can protect your home and assets from care fees, government claims, and inheritance tax – ensuring your wealth passes to your intended beneficiaries.',
        order: 3,
        targetAudience: 'Homeowners & asset owners',
        referralPath: ReferralPathType.ESTATE_PLANNING,
      },
      {
        name: 'NHS Pension Maximization',
        slug: 'nhs-pension-maximization',
        description:
          'Maximize your NHS pension benefits: understand your options for tax-free cash, retirement income planning, and how to avoid common pitfalls that reduce your lifetime income.',
        order: 4,
        targetAudience: 'NHS employees',
        referralPath: ReferralPathType.FINANCIAL_ADVICE,
      },
      {
        name: 'Local Government Pensions',
        slug: 'local-government-pensions',
        description:
          'Navigate the Local Government Pension Scheme (LGPS): learn about transfer options, retirement planning strategies, and how to optimize your pension income as a council/local authority employee.',
        order: 5,
        targetAudience: 'Local authority staff',
        referralPath: ReferralPathType.FINANCIAL_ADVICE,
      },
      {
        name: 'Director Pension Strategies',
        slug: 'director-pension-strategies',
        description:
          'Strategic pension planning for company directors: extract maximum value from your business, plan for business succession, and protect your personal wealth through director-specific pension arrangements.',
        order: 6,
        targetAudience: 'Company directors',
        referralPath: ReferralPathType.FINANCIAL_ADVICE,
      },
      {
        name: 'Self-Employed Retirement Planning',
        slug: 'self-employed-retirement-planning',
        description:
          "Retirement planning for the self-employed: understand personal pensions, SIPPs, and strategies to build a secure retirement income when you don't have an employer-sponsored pension scheme.",
        order: 7,
        targetAudience: 'Self-employed & freelancers',
        referralPath: ReferralPathType.FINANCIAL_ADVICE,
      },
    ];

    this.logger.log(`⏳ Checking ${categoriesData.length} categories for existence...`);

    for (const categoryData of categoriesData) {
      try {
        // Check if category already exists by slug (most reliable identifier)
        const existingCategory = await this.prisma.category.findUnique({
          where: { slug: categoryData.slug },
        });

        if (existingCategory) {
          this.logger.log(
            `⏭️ Category "${categoryData.name}" (slug: ${categoryData.slug}) already exists. Skipping creation.`,
          );
          continue;
        }

        // Create category if it doesn't exist
        const createdCategory = await this.prisma.category.create({
          data: {
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description,
            order: categoryData.order,
            targetAudience: categoryData.targetAudience,
            referralPath: categoryData.referralPath,
          },
        });

        this.logger.log(
          `✅ Created category "${createdCategory.name}" (ID: ${createdCategory.id})`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to seed category "${categoryData.name}": ${error.message}`,
          error.stack,
        );
        // Continue with other categories even if one fails
        continue;
      }
    }

    // Verification: Log final category count
    const totalCategories = await this.prisma.category.count();
    this.logger.log(`📊 Total categories in database: ${totalCategories}`);
  }
}
