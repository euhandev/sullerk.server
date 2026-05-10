import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { UpdateGlobalConfigDto } from './dto/global-config.dto';
import { UpdateBaseValuesDto } from './dto/base-values.dto';
import { UpdateMultipliersDto } from './dto/multipliers.dto';
import { UpdateCardRulesDto } from './dto/card-rules.dto';
import { UpdateHonoursDto } from './dto/honours.dto';
import { UpdateApiRulesDto } from './dto/api-rules.dto';
import { COAStatus } from '@prisma/client';

@Injectable()
export class PriceEngineService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.priceEngineConfig.findMany({
      include: {
        baseValues: true,
        proofMultipliers: {
          include: { rules: true },
        },
        signatureMultipliers: true,
        authMultipliers: true,
        cardMultipliers: {
          include: { rules: true },
        },
        honourMultipliers: true,
        apiPerformanceRules: true,
      },
    });
  }

  async getConfig(sport: string) {
    const config = await this.prisma.priceEngineConfig.findUnique({
      where: { sport },
      include: {
        baseValues: true,
        proofMultipliers: {
          include: { rules: true },
        },
        signatureMultipliers: true,
        authMultipliers: true,
        cardMultipliers: {
          include: { rules: true },
        },
        honourMultipliers: true,
        apiPerformanceRules: true,
      },
    });

    if (!config) {
      throw new NotFoundException(`Price engine config for sport "${sport}" not found`);
    }

    return config;
  }

  async updateGlobalConfig(sport: string, dto: UpdateGlobalConfigDto) {
    return this.prisma.priceEngineConfig.update({
      where: { sport },
      data: dto,
    });
  }

  async updateBaseValues(sport: string, dto: UpdateBaseValuesDto) {
    const config = await this.getConfig(sport);

    // Using transaction to ensure atomic update
    return this.prisma.$transaction(async (tx) => {
      // Clear existing base values for this config
      await tx.baseValue.deleteMany({
        where: { configId: config.id },
      });

      // Create new ones
      return tx.priceEngineConfig.update({
        where: { id: config.id },
        data: {
          baseValues: {
            create: dto.values.map((v) => ({
              category: v.category,
              basePrice: v.basePrice,
            })),
          },
        },
        include: { baseValues: true },
      });
    });
  }

  async updateMultipliers(sport: string, dto: UpdateMultipliersDto) {
    const config = await this.getConfig(sport);

    return this.prisma.$transaction(async (tx) => {
      if (dto.proofGroups) {
        // Delete all groups and rules for this config
        await tx.proofMultiplierGroup.deleteMany({
          where: { configId: config.id },
        });

        // Recreate groups and rules
        for (const group of dto.proofGroups) {
          await tx.proofMultiplierGroup.create({
            data: {
              configId: config.id,
              proofType: group.proofType,
              rules: {
                create: group.rules.map((r) => ({
                  viewKey: r.viewKey,
                  multiplier: r.multiplier,
                })),
              },
            },
          });
        }
      }

      if (dto.signatures) {
        await tx.signatureMultiplier.deleteMany({
          where: { configId: config.id },
        });
        await tx.signatureMultiplier.createMany({
          data: dto.signatures.map((s) => ({
            configId: config.id,
            signatureKey: s.signatureKey,
            multiplier: s.multiplier,
          })),
        });
      }

      if (dto.auths) {
        await tx.authMultiplier.deleteMany({
          where: { configId: config.id },
        });
        await tx.authMultiplier.createMany({
          data: dto.auths.map((a) => ({
            configId: config.id,
            companyKey: a.companyKey,
            multiplier: a.multiplier,
          })),
        });
      }

      return this.getConfig(sport);
    });
  }

  async updateCardRules(sport: string, dto: UpdateCardRulesDto) {
    const config = await this.getConfig(sport);

    return this.prisma.$transaction(async (tx) => {
      await tx.cardMultiplierGroup.deleteMany({
        where: { configId: config.id },
      });

      for (const group of dto.groups) {
        await tx.cardMultiplierGroup.create({
          data: {
            configId: config.id,
            groupType: group.groupType,
            rules: {
              create: group.rules.map((r) => ({
                ruleKey: r.ruleKey,
                multiplier: r.multiplier,
                label: r.label,
                sortOrder: r.sortOrder,
              })),
            },
          },
        });
      }

      return this.getConfig(sport);
    });
  }

  async updateHonours(sport: string, dto: UpdateHonoursDto) {
    const config = await this.getConfig(sport);

    return this.prisma.$transaction(async (tx) => {
      await tx.honourMultiplier.deleteMany({
        where: { configId: config.id },
      });

      await tx.honourMultiplier.createMany({
        data: dto.honours.map((h) => ({
          configId: config.id,
          honourKey: h.honourKey,
          multiplier: h.multiplier,
          isActive: h.isActive ?? true,
          sportContext: sport,
        })),
      });

      return this.getConfig(sport);
    });
  }

  async updateApiRules(sport: string, dto: UpdateApiRulesDto) {
    const config = await this.getConfig(sport);

    return this.prisma.$transaction(async (tx) => {
      await tx.apiPerformanceRule.deleteMany({
        where: { configId: config.id },
      });

      await tx.apiPerformanceRule.createMany({
        data: dto.rules.map((r) => ({
          configId: config.id,
          metricKey: r.metricKey,
          effectType: r.effectType,
          adjustmentPercent: r.adjustmentPercent,
          isActive: r.isActive ?? true,
        })),
      });

      return this.getConfig(sport);
    });
  }

  /**
   * Calculate price for a listing based on new engine rules
   */
  async calculatePrice(data: any) {
    const {
      sport,
      category,
      signatureType,
      photoProofType,
      videoProofType,
      coaStatus,
      companyAuthentication,
      cardNumbered,
      cardFeature,
      appliedHonours,
    } = data;

    const config = await this.getConfig(sport);
    const breakdown: any[] = [];

    // --- 1. Base Price ---
    const baseValue = config.baseValues.find((v) => v.category === category);
    if (!baseValue) {
      throw new NotFoundException(
        `Base price for category "${category}" in sport "${sport}" not found`,
      );
    }

    let currentPrice = baseValue.basePrice;
    breakdown.push({ label: 'Base Price', value: currentPrice, type: 'BASE' });

    // --- 2. Derived Proof Type Multiplier ---
    // Rule: Both (photo_video) > Photo > Video > None
    let derivedProofType = 'NONE';
    if (photoProofType !== 'NO_PROOF' && videoProofType !== 'NO_PROOF')
      derivedProofType = 'PHOTO_VIDEO';
    else if (photoProofType !== 'NO_PROOF') derivedProofType = 'PHOTO';
    else if (videoProofType !== 'NO_PROOF') derivedProofType = 'VIDEO';

    if (derivedProofType !== 'NONE') {
      const proofGroup = config.proofMultipliers.find((g) => g.proofType === derivedProofType);

      // Try to find a rule matching the specific view provided, or fallback to the first rule
      let targetView = 'FULL_VIEW';
      if (derivedProofType === 'PHOTO') targetView = photoProofType;
      else if (derivedProofType === 'VIDEO') targetView = videoProofType;
      // For PHOTO_VIDEO, we might have a specific composite view or just use the first rule

      const proofRule =
        proofGroup?.rules.find((r) => r.viewKey === targetView) || proofGroup?.rules[0];

      if (proofRule && proofRule.multiplier !== 1) {
        const prev = currentPrice;
        currentPrice *= proofRule.multiplier;
        breakdown.push({
          label: `Proof Type (${derivedProofType})`,
          multiplier: proofRule.multiplier,
          value: currentPrice,
          diff: currentPrice - prev,
        });
      }
    }

    // --- 3. Signature Multiplier ---
    const sigMult = config.signatureMultipliers.find((s) => s.signatureKey === signatureType);
    if (sigMult && sigMult.multiplier !== 1) {
      const prev = currentPrice;
      currentPrice *= sigMult.multiplier;
      breakdown.push({
        label: `Signature (${signatureType})`,
        multiplier: sigMult.multiplier,
        value: currentPrice,
        diff: currentPrice - prev,
      });
    }

    // --- 4. Best Authentication Multiplier (Hierarchy) ---
    // Professional Auth > COA Included > None
    let authMultiplier = 1;
    let authLabel = 'None';

    const profAuthKey = companyAuthentication?.toUpperCase() || 'NONE';
    const profAuthMult = config.authMultipliers.find((a) => a.companyKey === profAuthKey);

    if (profAuthMult && profAuthKey !== 'NONE' && profAuthKey !== 'NOT AUTHENTICATED') {
      authMultiplier = profAuthMult.multiplier;
      authLabel = `Professional Auth (${profAuthKey})`;
    } else if (coaStatus === COAStatus.COA_INCLUDED || coaStatus === COAStatus.SELF_CERTIFIED) {
      // Fallback to COA if professional auth is missing
      const coaMult = config.authMultipliers.find((a) => a.companyKey === COAStatus.COA_INCLUDED);
      if (coaMult) {
        authMultiplier = coaMult.multiplier;
        authLabel = `COA (${coaStatus})`;
      }
    }

    if (authMultiplier !== 1) {
      const prev = currentPrice;
      currentPrice *= authMultiplier;
      breakdown.push({
        label: authLabel,
        multiplier: authMultiplier,
        value: currentPrice,
        diff: currentPrice - prev,
      });
    }

    // --- 5. Card Specifics (Only if category is CARD) ---
    if (category === 'CARD') {
      const cardGroups = config.cardMultipliers;

      // Numbering
      const numGroup = cardGroups.find((g) => g.groupType === 'NUMBERING');
      const numRule = numGroup?.rules.find((r) => r.ruleKey === cardNumbered);
      if (numRule && numRule.multiplier !== 1) {
        const prev = currentPrice;
        currentPrice *= numRule.multiplier;
        breakdown.push({
          label: `Card Rarity (${cardNumbered})`,
          multiplier: numRule.multiplier,
          value: currentPrice,
          diff: currentPrice - prev,
        });
      }

      // Feature
      const featGroup = cardGroups.find((g) => g.groupType === 'FEATURE');
      const featRule = featGroup?.rules.find((r) => r.ruleKey === cardFeature);
      if (featRule && featRule.multiplier !== 1) {
        const prev = currentPrice;
        currentPrice *= featRule.multiplier;
        breakdown.push({
          label: `Card Feature (${cardFeature})`,
          multiplier: featRule.multiplier,
          value: currentPrice,
          diff: currentPrice - prev,
        });
      }
    }

    // --- 6. Trophies/Individual Awards (Additive Boost) ---
    if (appliedHonours && appliedHonours.length > 0) {
      let totalTrophyBoost = 0;
      for (const honourKey of appliedHonours) {
        const hMult = config.honourMultipliers.find((h) => h.honourKey === honourKey);
        if (hMult) {
          // If multiplier is 1.2, it's a 20% boost (0.2)
          totalTrophyBoost += hMult.multiplier - 1;
          breakdown.push({
            label: `Award: ${honourKey}`,
            boost: `+${((hMult.multiplier - 1) * 100).toFixed(0)}%`,
          });
        }
      }

      if (totalTrophyBoost > 0) {
        const prev = currentPrice;
        currentPrice *= 1 + totalTrophyBoost;
        breakdown.push({
          label: 'Total Trophies Boost',
          multiplier: (1 + totalTrophyBoost).toFixed(2),
          value: currentPrice,
          diff: currentPrice - prev,
        });
      }
    }

    // --- Final Step: Rounding ---
    const finalPrice = Math.round(currentPrice);

    return {
      finalPrice,
      breakdown,
      configId: config.id,
      platformFee: Math.round(finalPrice * (config.platformFeePercent / 100)),
      sellerRange: {
        min: Math.round(finalPrice * (1 - config.sellerAdjustRangePercent / 100)),
        max: Math.round(finalPrice * (1 + config.sellerAdjustRangePercent / 100)),
      },
    };
  }
}
