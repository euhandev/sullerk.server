// config.types.ts

export interface EnvConfig {
  PORT: string;
  NODE_ENV: string;

  DATABASE_URL: string;

  SERVER_URL: string;

  DEFAULT_ADMIN_EMAIL: string;
  DEFAULT_ADMIN_PASSWORD: string;
  DEFAULT_ADMIN_CONTACT_NO: string;

  DEFAULT_ADVISOR_EMAIL: string;
  DEFAULT_ADVISOR_PASSWORD: string;
  DEFAULT_ADVISOR_CONTACT_NO: string;

  DEFAULT_CUSTOMER_EMAIL: string;
  DEFAULT_CUSTOMER_PASSWORD: string;
  DEFAULT_CUSTOMER_CONTACT_NO: string;

  MEILISEARCH_HOST: string;
  MEILISEARCH_API_KEY: string;
  MEILISEARCH_INDEX_NAME: string;

  BCRYPT_SALT_ROUNDS: string;
  JWT_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  COOKIE_DOMAIN: string;
  JWT_EXPIRES_IN: string;

  STRIPE_SK: string;
  STRIPE_PK: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PLATFORM_FEE_PERCENT: string;

  BREVO_API_KEY: string;

  DO_SPACE_ENDPOINT: string;
  DO_SPACE_SECRET_KEY: string;
  DO_SPACE_ACCESS_KEY: string;
  DO_SPACE_BUCKET: string;

  CLIENT_URL: string;

  GOOGLE_MAP_API_KEY: string;

  FIREBASE_TYPE: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_CLIENT_ID: string;
  FIREBASE_AUTH_URI: string;
  FIREBASE_TOKEN_URI: string;
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string;
  FIREBASE_CLIENT_CERT_URL: string;
  FIREBASE_UNIVERSE_DOMAIN: string;

  SESSION_SECRET: string;
  APP_URL: string;
  FRONTEND_URL: string;

  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;

  MAIL_USER: string;
  MAIL_PASS: string;
  MAIL_FROM: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

// config.types.ts (continued)

export type EnvKey = keyof EnvConfig;
