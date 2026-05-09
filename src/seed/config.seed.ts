import {
  PrismaClient,
  ListingCategory,
  ProofType,
  ProofViewKey,
  SignatureKey,
  AuthCompanyKey,
  CardMultiplierType,
  CardRuleKey,
  ApiEffectType,
} from '@prisma/client';

const prisma = new PrismaClient();

const SPORTS = [
  'Football',
  'Basketball',
  'Cricket',
  'Rugby',
  'Tennis',
  'Boxing',
  'UFC/MMA',
  'F1',
  'Darts',
  'Baseball',
  'Golf',
  'Athletics',
];

const HONOURS_BY_SPORT: Record<string, string[]> = {
  Football: [
    'Premier League',
    'FA Cup',
    'League Cup (Carabao)',
    'Community Shield',
    'La Liga',
    'Copa del Rey',
    'Supercopa de España',
    'Bundesliga',
    'DFB-Pokal',
    'DFL-Supercup',
    'Serie A',
    'Coppa Italia',
    'Supercoppa Italiana',
    'Ligue 1',
    'Coupe de France',
    'Trophée des Champions',
    'Champions League',
    'Europa League',
    'Conference League',
    'UEFA Super Cup',
    'Club World Cup',
    'World Cup',
    'European Championship',
    'Copa América',
    'Africa Cup of Nations',
    'Nations League',
    "Ballon d'Or",
    'Golden Boot',
    'FIFA Best',
    'PFA Player of the Year',
    'Golden Glove',
  ],
  Basketball: [
    'NBA Championship',
    'NBA Finals MVP',
    'NBA MVP',
    'All-Star Game MVP',
    'Scoring Title',
    'Defensive Player of the Year',
    'Rookie of the Year',
    'Olympic Gold Medal',
    'FIBA World Cup',
  ],
  Cricket: [
    'ICC Cricket World Cup',
    'ICC T20 World Cup',
    'The Ashes',
    'ICC Champions Trophy',
    'IPL Title',
    'ICC Test Championship',
    'Wisden Cricketer of the Year',
  ],
  Rugby: [
    'Rugby World Cup',
    'Six Nations',
    'Rugby Championship',
    'Lions Series',
    'Heineken Champions Cup',
    'Premiership Title',
    'World Rugby Player of the Year',
  ],
  Tennis: [
    'Wimbledon',
    'US Open',
    'French Open (Roland Garros)',
    'Australian Open',
    'ATP Finals',
    'Davis Cup',
    'Olympic Gold Medal',
    'Grand Slam (Calendar Year)',
  ],
  Boxing: [
    'WBA World Title',
    'WBC World Title',
    'IBF World Title',
    'WBO World Title',
    'Undisputed Champion',
    'Ring Magazine Fighter of the Year',
    'Olympic Gold Medal',
  ],
  'UFC/MMA': [
    'UFC Championship',
    'UFC Performance of the Night',
    'UFC Fight of the Night',
    'UFC Knockout of the Year',
    'UFC Hall of Fame',
    'Bellator Championship',
  ],
  F1: [
    "World Drivers' Championship",
    'Race Win',
    'Pole Position Record',
    'Fastest Lap Award',
    "Constructors' Championship Contribution",
    'Monaco GP Win',
    'F1 Rookie of the Year',
    'Grand Chelem',
  ],
  Darts: [
    'PDC World Championship',
    'Premier League Darts',
    'World Grand Prix',
    'Grand Slam of Darts',
    'World Matchplay',
    'UK Open',
    'Nine-Dart Finish',
    'BDO World Championship',
    'PDC Player of the Year',
  ],
  Baseball: [
    'World Series',
    'MLB MVP',
    'Cy Young Award',
    'Silver Slugger',
    'Gold Glove',
    'All-Star Game MVP',
    'Triple Crown',
    'Hall of Fame',
  ],
  Golf: [
    'The Masters',
    'US Open',
    'The Open Championship',
    'PGA Championship',
    'Ryder Cup',
    'FedEx Cup',
    'Olympic Gold Medal',
    'Career Grand Slam',
  ],
  Athletics: [
    'Olympic Gold Medal',
    'World Championship Gold',
    'World Record',
    'Diamond League Title',
    'Commonwealth Games Gold',
  ],
};

const API_METRICS_BY_SPORT: Record<string, string[]> = {
  Football: [
    'Win',
    'Loss',
    'Draw',
    'Goal',
    'Assist',
    'Clean Sheet',
    'Injury',
    'Hat-trick',
    'Man of the Match',
    'Red Card',
    'Yellow Card',
  ],
  Basketball: [
    'Win',
    'Loss',
    'Points Scored',
    'Rebound',
    'Assist',
    'Block',
    'Steal',
    'Triple-Double',
    'Injury',
  ],
  Cricket: [
    'Win',
    'Loss',
    'Century',
    'Five-Wicket Haul',
    'Catch',
    'Run Out',
    'Duck',
    'Man of the Match',
    'Injury',
  ],
  Rugby: [
    'Win',
    'Loss',
    'Try',
    'Conversion',
    'Penalty Kick',
    'Man of the Match',
    'Yellow Card',
    'Red Card',
    'Injury',
  ],
  F1: [
    'Race Win',
    'Podium',
    'DNF',
    'Pole Position',
    'Fastest Lap',
    'Crash/Incident',
    'Championship Point',
  ],
  Darts: ['Match Win', 'Match Loss', '180s', 'Nine-Dart Finish', 'High Checkout', 'Tournament Win'],
  Boxing: ['Win (KO)', 'Win (Decision)', 'Loss', 'Draw', 'Title Defence', 'Injury'],
  'UFC/MMA': [
    'Win (KO/TKO)',
    'Win (Submission)',
    'Win (Decision)',
    'Loss',
    'Fight of the Night',
    'Injury',
  ],
  Tennis: ['Match Win', 'Match Loss', 'Set Bagel (6-0)', 'Ace Record', 'Grand Slam Win', 'Injury'],
  Baseball: ['Win', 'Loss', 'Home Run', 'Strikeout', 'RBI', 'Error', 'Injury', 'MVP Performance'],
  Golf: ['Tournament Win', 'Top 10 Finish', 'Missed Cut', 'Hole-in-One', 'Eagle', 'Injury'],
  Athletics: ['Gold Medal', 'Silver Medal', 'Bronze Medal', 'Personal Best', 'DNF', 'Injury'],
};

const BASE_VALUES = [
  { category: ListingCategory.SHIRT, price: 200 },
  { category: ListingCategory.BOOTS, price: 150 },
  { category: ListingCategory.CARD, price: 80 },
  { category: ListingCategory.GLOVES, price: 120 },
  { category: ListingCategory.MATCH_BALL, price: 250 },
  { category: ListingCategory.SHORTS, price: 100 },
  { category: ListingCategory.SIGNED_PHOTO, price: 60 },
];

const PHOTO_PROOF_RULES = [
  { viewKey: ProofViewKey.NO_PROOF, multiplier: 1.05 },
  { viewKey: ProofViewKey.PARTIAL_VIEW, multiplier: 1.1 },
  { viewKey: ProofViewKey.FULL_VIEW, multiplier: 1.2 },
  { viewKey: ProofViewKey.PARTIAL_VIEW_ATHLETE, multiplier: 1.25 },
  { viewKey: ProofViewKey.FULL_VIEW_ATHLETE, multiplier: 1.35 },
];

const VIDEO_PROOF_RULES = [
  { viewKey: ProofViewKey.NO_PROOF, multiplier: 1.1 },
  { viewKey: ProofViewKey.PARTIAL_VIEW, multiplier: 1.2 },
  { viewKey: ProofViewKey.FULL_VIEW, multiplier: 1.35 },
  { viewKey: ProofViewKey.PARTIAL_VIEW_ATHLETE, multiplier: 1.4 },
  { viewKey: ProofViewKey.FULL_VIEW_ATHLETE, multiplier: 1.5 },
];

const SIGNATURE_RULES = [
  { key: SignatureKey.NONE, multiplier: 1.0 },
  { key: SignatureKey.PARTIAL, multiplier: 1.3 },
  { key: SignatureKey.FULL, multiplier: 1.6 },
  { key: SignatureKey.PERSONALISED, multiplier: 1.8 },
];

const AUTH_RULES = [
  { key: AuthCompanyKey.NONE, multiplier: 1.0 },
  { key: AuthCompanyKey.BECKETT, multiplier: 1.7 },
  { key: AuthCompanyKey.PSA, multiplier: 1.7 },
  { key: AuthCompanyKey.JSA, multiplier: 1.65 },
  { key: AuthCompanyKey.ACG, multiplier: 1.6 },
  { key: AuthCompanyKey.AFTAL, multiplier: 1.55 },
  { key: AuthCompanyKey.SGC, multiplier: 1.5 },
  { key: AuthCompanyKey.CGC, multiplier: 1.45 },
];

const CARD_NUMBERED_RULES = [
  { key: CardRuleKey.NUM_5, multiplier: 3.0 },
  { key: CardRuleKey.NUM_10, multiplier: 2.5 },
  { key: CardRuleKey.NUM_15, multiplier: 2.2 },
  { key: CardRuleKey.NUM_20, multiplier: 1.9 },
  { key: CardRuleKey.NUM_25, multiplier: 1.6 },
  { key: CardRuleKey.NUM_49, multiplier: 1.35 },
  { key: CardRuleKey.NUM_75, multiplier: 1.2 },
  { key: CardRuleKey.NUM_100, multiplier: 1.15 },
  { key: CardRuleKey.UNNUMBERED, multiplier: 1.0 },
];

const CARD_FEATURE_RULES = [
  { key: CardRuleKey.SIG_ONLY, multiplier: 1.4 },
  { key: CardRuleKey.PATCH_ONLY, multiplier: 1.3 },
  { key: CardRuleKey.SIG_PATCH, multiplier: 1.7 },
  { key: CardRuleKey.NO_EXTRAS, multiplier: 1.0 },
];

const CARD_GRADE_RULES = [
  { key: CardRuleKey.RAW, multiplier: 1.0 },
  { key: CardRuleKey.GRADE_1, multiplier: 0.5 },
  { key: CardRuleKey.GRADE_2, multiplier: 0.6 },
  { key: CardRuleKey.GRADE_3, multiplier: 0.7 },
  { key: CardRuleKey.GRADE_4, multiplier: 0.8 },
  { key: CardRuleKey.GRADE_5, multiplier: 0.9 },
  { key: CardRuleKey.GRADE_6, multiplier: 1.0 },
  { key: CardRuleKey.GRADE_7, multiplier: 1.1 },
  { key: CardRuleKey.GRADE_8, multiplier: 1.3 },
  { key: CardRuleKey.GRADE_8_5, multiplier: 1.5 },
  { key: CardRuleKey.GRADE_9, multiplier: 1.8 },
  { key: CardRuleKey.GRADE_9_5, multiplier: 2.2 },
  { key: CardRuleKey.GRADE_10, multiplier: 3.0 },
];

async function main() {
  console.log('🚀 Starting Price Engine seeding...');
  let seededCount = 0;
  let skippedCount = 0;

  for (const sport of SPORTS) {
    // Check if a configuration for this sport already exists
    const existing = await prisma.priceEngineConfig.findUnique({
      where: { sport },
    });

    if (existing) {
      console.log(`- ⏩ Config for "${sport}" already exists. Skipping.`);
      skippedCount++;
      continue;
    }

    console.log(`- ✨ Seeding default config for "${sport}"...`);

    try {
      await prisma.priceEngineConfig.create({
        data: {
          sport,
          isActive: true,
          description: `Default pricing engine for ${sport}`,
          platformFeePercent: 5.0,
          sellerAdjustRangePercent: 10.0,
          apiRecalcIntervalGames: 2,
          baseValues: {
            create: BASE_VALUES.map((bv) => ({
              category: bv.category,
              basePrice: bv.price,
            })),
          },
          proofMultipliers: {
            create: [
              {
                proofType: ProofType.PHOTO,
                rules: {
                  create: PHOTO_PROOF_RULES.map((r) => ({
                    viewKey: r.viewKey,
                    multiplier: r.multiplier,
                  })),
                },
              },
              {
                proofType: ProofType.VIDEO,
                rules: {
                  create: VIDEO_PROOF_RULES.map((r) => ({
                    viewKey: r.viewKey,
                    multiplier: r.multiplier,
                  })),
                },
              },
            ],
          },
          signatureMultipliers: {
            create: SIGNATURE_RULES.map((r) => ({
              signatureKey: r.key,
              multiplier: r.multiplier,
            })),
          },
          authMultipliers: {
            create: AUTH_RULES.map((r) => ({
              companyKey: r.key,
              multiplier: r.multiplier,
            })),
          },
          cardMultipliers: {
            create: [
              {
                groupType: CardMultiplierType.NUMBERING,
                rules: {
                  create: CARD_NUMBERED_RULES.map((r) => ({
                    ruleKey: r.key,
                    multiplier: r.multiplier,
                  })),
                },
              },
              {
                groupType: CardMultiplierType.FEATURE,
                rules: {
                  create: CARD_FEATURE_RULES.map((r) => ({
                    ruleKey: r.key,
                    multiplier: r.multiplier,
                  })),
                },
              },
              {
                groupType: CardMultiplierType.GRADE,
                rules: {
                  create: CARD_GRADE_RULES.map((r) => ({
                    ruleKey: r.key,
                    multiplier: r.multiplier,
                  })),
                },
              },
            ],
          },
          honourMultipliers: {
            create: (HONOURS_BY_SPORT[sport] || []).map((h) => ({
              honourKey: h,
              multiplier: 1.2, // Default multiplier for honours
              sportContext: sport,
            })),
          },
          apiPerformanceRules: {
            create: [
              ...(API_METRICS_BY_SPORT[sport] || []).map((m) => ({
                metricKey: m,
                effectType: ApiEffectType.POSITIVE,
                adjustmentPercent: 5.0, // Default 5% increase
              })),
              ...(API_METRICS_BY_SPORT[sport] || []).map((m) => ({
                metricKey: m,
                effectType: ApiEffectType.NEGATIVE,
                adjustmentPercent: 3.0, // Default 3% decrease
              })),
            ],
          },
        },
      });
      seededCount++;
    } catch (error) {
      console.error(`- ❌ Failed to seed config for "${sport}":`, error);
    }
  }

  console.log(`\n✅ Seeding Summary:`);
  console.log(`- Created: ${seededCount}`);
  console.log(`- Skipped: ${skippedCount}`);
  console.log('🚀 Seed process finished.');
}

main()
  .catch((e) => {
    console.error('💥 Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
