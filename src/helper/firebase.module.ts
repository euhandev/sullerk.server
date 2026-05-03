// // helper/firebase.module.ts
// import { ConfigModule } from '@/config/config.module';
// import { ConfigService } from '@/config/config.service';
// import { Global, Module, OnModuleInit } from '@nestjs/common';
// import * as admin from 'firebase-admin';

// @Global()
// @Module({
//   imports: [ConfigModule],
//   providers: [
//     {
//       provide: 'FIREBASE_ADMIN',
//       useFactory: (configService: ConfigService) => {
//         // Get the service account JSON from environment variables
//         const serviceAccount = {
//           type: configService.get('FIREBASE_TYPE'),
//           project_id: configService.get('FIREBASE_PROJECT_ID'),
//           private_key_id: configService.get('FIREBASE_PRIVATE_KEY_ID'),
//           private_key: configService
//             .get('FIREBASE_PRIVATE_KEY')
//             .replace(/\\n/g, '\n'),
//           client_email: configService.get('FIREBASE_CLIENT_EMAIL'),
//           client_id: configService.get('FIREBASE_CLIENT_ID'),
//           auth_uri: configService.get('FIREBASE_AUTH_URI'),
//           token_uri: configService.get('FIREBASE_TOKEN_URI'),
//           auth_provider_x509_cert_url: configService.get(
//             'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
//           ),
//           client_x509_cert_url: configService.get(
//             'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
//           ),
//           universe_domain: configService.get('FIREBASE_UNIVERSE_DOMAIN'),
//         };

//         // Validate required fields
//         const requiredFields = ['project_id', 'private_key', 'client_email'];
//         for (const field of requiredFields) {
//           if (!serviceAccount[field as keyof typeof serviceAccount]) {
//             throw new Error(`Missing Firebase configuration: ${field}`);
//           }
//         }

//         return admin.initializeApp({
//           credential: admin.credential.cert(serviceAccount as any),
//         });
//       },
//       inject: [ConfigService],
//     },
//     {
//       provide: 'FIREBASE_MESSAGING',
//       useFactory: (firebaseApp: admin.app.App) => {
//         return firebaseApp.messaging();
//       },
//       inject: ['FIREBASE_ADMIN'],
//     },
//   ],
//   exports: ['FIREBASE_ADMIN', 'FIREBASE_MESSAGING'],
// })
// export class FirebaseModule implements OnModuleInit {
//   constructor(private configService: ConfigService) {}

//   onModuleInit() {
//     // Optional: Log that Firebase is initialized
//     console.log('Firebase module initialized');
//   }
// }
