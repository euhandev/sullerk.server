// import { PrismaService } from '@/helper/prisma.service';
// import { UserService } from '@/modules/user/user.service';
// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { BcryptService } from './bcrypt.service';
// import { seedLocations } from '@/locationData';
// import { generateSlug } from './slugGenerator';
// import { ConfigService } from '@/config/config.service';
// // import { seedLocations } from '@/locationData';

// @Injectable()
// export class AdminInitService implements OnModuleInit {
//   private readonly logger = new Logger(AdminInitService.name);
//   private;

//   constructor(
//     private readonly userService: UserService,
//     private readonly configService: ConfigService,
//     private readonly prisma: PrismaService,
//     private readonly bcryptService: BcryptService,
//   ) {}

//   async findByEmailOrContact(email: string, contactNo: string) {
//     return this.prisma.user.findFirst({
//       where: {
//         OR: [{ email }, { contactNo }],
//       },
//     });
//   }

//   async onModuleInit() {
//     this.logger.log('🚀 Running SeedingService...');
//     await this.handleAdminCreation();
//     await this.handleCustomerCreation();
//     await this.handlePlansCreation();

//     this.logger.log('🚀 Seeding completed...');
//   }

//   async handleAdminCreation() {
//     try {
//       const email = 'admin@example.com';
//       const contactNo = '017000000003';
//       const password = '123456';

//       const exists = await this.findByEmailOrContact(email, contactNo);
//       if (exists) {
//         // this.logger.log('✅ Admin already exists. Skipping auto-create.');
//         return;
//       }

//       await this.userService.createAdmin({
//         email,
//         contactNo,
//         username: 'euhan',
//         password,
//         role: Role.ADMIN,
//         admin: {
//           fullName: 'Super Admin',
//           location: 'Head Office',
//         },
//       });

//       this.logger.log('✅ Default admin created successfully.');
//     } catch (error) {
//       this.logger.error('❌ Failed to create default admin', error.stack);
//     }
//   }

//   async handleCustomerCreation() {
//     try {
//       const email = 'customer@example.com';
//       const contactNo = '017000000005';
//       const password = await this.bcryptService.hash('123456');

//       const exists = await this.findByEmailOrContact(email, contactNo);

//       if (exists) {
//         return;
//       }
//       console.log('-----🫎🫎🫎🫎🫎🫎🫎location seeding started');
//       for (const county of seedLocations) {
//         await this.prisma.$transaction(
//           async (TX) => {
//             const createdProvince = await this.locationService.createWithTrancsaction(
//               { name: county.name, type: 'PROVINCE' },
//               TX,
//             );

//             await Promise.all(
//               county.municipalities.map((municipality) =>
//                 this.locationService.createWithTrancsaction(
//                   {
//                     name: municipality,
//                     type: 'MUNICIPALITY',
//                     parentId: createdProvince.id,
//                     parentName: county.name,
//                   },
//                   TX,
//                 ),
//               ),
//             );
//           },
//           { timeout: 90000 },
//         );
//       }
//       // 1️⃣ Create (or find) location hierarchy
//       const province = await this.locationService.create({
//         name: 'Dhaka',
//         type: 'PROVINCE',
//       });

//       const municipality = await this.locationService.create({
//         name: 'Dhaka North',
//         type: 'MUNICIPALITY',
//         parentId: province.id, // ✅ link to province
//         parentName: province.name,
//       });

//       const area = await this.locationService.create({
//         name: 'Gulshan',
//         type: 'AREA',
//         parentId: municipality.id, // ✅ link to municipality
//         parentName: municipality.name,
//       });

//       // 2️⃣ Create default customer with property
//       await this.prisma.user.create({
//         data: {
//           email,
//           contactNo,
//           password,
//           role: Role.CUSTOMER,
//           username: 'bajram',
//           customer: {
//             create: {
//               fullName: 'Bajram',
//               address: 'Dhaka City',
//               sellingProperties: {
//                 create: {
//                   name: 'Luxury Villa in Dhaka',
//                   description: 'A beautiful modern villa with garden and pool.',
//                   slug: generateSlug(`VILLA-4-Gulshan-Dhaka-39493JFL9`),
//                   lat: '23.8103',
//                   long: '90.4125',
//                   price: 15000000,
//                   livingArea: 3500,
//                   constructionYear: 2018,
//                   type: 'VILLA',
//                   numberOfRoom: 5,
//                   facilities: ['Pool', 'Garden', 'Garage'],
//                   address: 'Gulshan, Dhaka',
//                   provinceId: province.id,
//                   municipalityId: municipality.id,
//                   areaId: area.id,
//                   files: {
//                     createMany: {
//                       data: [
//                         {
//                           url: 'https://i.ibb.co.com/xK8P0mGN/country.png',
//                           type: 'IMAGE',
//                         },
//                         {
//                           url: 'https://i.ibb.co.com/JWbN8NXz/image-6.png',
//                           type: 'IMAGE',
//                         },
//                         {
//                           url: 'https://i.ibb.co.com/Pvw77k2V/image-7.png',
//                           type: 'IMAGE',
//                         },
//                         {
//                           url: 'https://i.ibb.co.com/JWbN8NXz/image-6.png',
//                           type: 'IMAGE',
//                         },
//                       ],
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       });
//       await this.locationService.seedMeilisearch();

//       this.logger.log('✅ Default Customer created successfully with location hierarchy.');
//     } catch (error) {
//       this.logger.error('❌ Failed to create default Customer', error.stack);
//     }
//   }
// }

// const brokerFirmPlanCreationData = {
//   planName: PlanName.POPULAR, //  BASIC POPULAR PREMIUM MAX
//   name: 'test',
//   description: 'test',
//   featuresList: ['tes1', 'test2'],
//   trialPeriodDays: 0,
//   stripePriceId: 'price_1RxyQI2NDdVUG7DQVXh3invl',
//   price: 20,
// };

// const propertyPlanCreationData = {
//   planName: PlanName.POPULAR, //  BASIC POPULAR PREMIUM MAX
//   name: 'test',
//   description: 'test',
//   featuresList: ['tes1', 'test2'],
//   durationInDays: 20,
// };

// const propertyPlanPrice = {
//   stripePriceId: 'price_1S1ApO2NDdVUG7DQRLse3FHI',
//   price: 20,
//   range: 2000000,
// };

// const boostingPlan = {
//   name: 'Premium Property Boost',
//   description: 'Boost your property listing to reach more potential buyers.',
//   durationInDays: 30,
//   stripePriceId: 'price_1Rz0JR2NDdVUG7DQuPP9flLH',
//   price: 30,
// };

// //! specialization type that's will be by deafult
// // Dento-alveolar surgery
// // Stomatological and maxillofacial surgery
// // Endodontics
// // Orthodontics and dento-facial orthopedics
// // Periodontology (Periodontics)
// // Pedodontics (Pediatric dentistry)
// // Dental prosthetics (Prosthodontics)
// // General dentistry
