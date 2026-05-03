// import { Injectable, Logger } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Issuer, generators, Client, Strategy as OIDCStrategy, TokenSet, UserinfoResponse } from 'openid-client';

// @Injectable()
// export class OidcStrategy extends PassportStrategy(OIDCStrategy, 'oidc') {
//   private static client: Client;
//   private static readonly logger = new Logger(OidcStrategy.name);

//   constructor() {
//     // Create the strategy lazily when Nest instantiates this provider
//     super(async (_req, _res, done) => {
//       try {
//         // --- 1) Discover OP
//         const issuer = await Issuer.discover(process.env.OIDC_ISSUER!);
//         if (!OidcStrategy.client) {
//           OidcStrategy.client = new issuer.Client({
//             client_id: process.env.OIDC_CLIENT_ID!,
//             client_secret: process.env.OIDC_CLIENT_SECRET!,
//             redirect_uris: [process.env.OIDC_REDIRECT_URI!],
//             response_types: ['code'],
//           });
//         }

//         // --- 2) Build params for authorization
//         const nonce = generators.nonce();
//         const state = generators.state();

//         const authParams = {
//           scope: process.env.OIDC_SCOPES || 'openid',
//           response_type: 'code',
//           redirect_uri: process.env.OIDC_REDIRECT_URI!,
//           nonce,
//           state,
//           // Some OPs support acr_values to force BankID or LoA
//           // acr_values: 'urn:grn:authn:se:bankid', // example, vendor-specific
//         };

//         // Let the strategy continue with this client & params
//         done(null, { client: OidcStrategy.client, params: authParams });
//       } catch (e) {
//         OidcStrategy.logger.error(e);
//         done(e as Error);
//       }
//     },
//     async (tokenset: TokenSet, userinfo: UserinfoResponse, done: Function) => {
//       try {
//         // tokenset contains id_token, access_token, etc.
//         // userinfo (if OP supports userinfo endpoint and scope) has attributes like name, national id, etc.
//         const idTokenClaims = tokenset.claims();

//         // Normalize a profile for your app
//         const profile = {
//           sub: idTokenClaims.sub,
//           name: userinfo?.name ?? idTokenClaims.name,
//           // Signicat/Criipto map “national identity number” differently; check your OP’s mapping
//           // Example (Signicat often uses `https://signicat.com/attributes/national-id` or “ssn” claim profile doc)
//           nationalId: (userinfo as any)?.ssn || idTokenClaims.ssn || (userinfo as any)?.national_identity_number,
//           idToken: tokenset.id_token,
//         };

//         // TODO: upsert user in DB by `sub` or nationalId
//         const appUser = { id: profile.sub, name: profile.name, nationalId: profile.nationalId };

//         done(null, appUser);
//       } catch (err) {
//         done(err);
//       }
//     });
//   }
// }
