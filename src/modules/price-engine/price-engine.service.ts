import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { UpdateGlobalConfigDto } from './dto/global-config.dto';
import { UpdateBaseValuesDto } from './dto/base-values.dto';
import { UpdateMultipliersDto } from './dto/multipliers.dto';
import { UpdateCardRulesDto } from './dto/card-rules.dto';
import { UpdateHonoursDto } from './dto/honours.dto';
import { UpdateApiRulesDto } from './dto/api-rules.dto';

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
}
