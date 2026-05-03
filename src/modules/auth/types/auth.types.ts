// @/modules/auth/auth.types.ts

/**
 * Access and ID tokens returned from Criipto
 */
export interface CriiptoTokens {
  access_token: string;
  id_token: string;
}

/**
 * Decoded ID token claims (JWT payload)
 */
export interface CriiptoIdTokenClaims {
  iss: string; // issuer
  aud: string; // audience
  identityscheme: string; // e.g., 'sebankid'
  authenticationtype: string; // e.g., 'urn:grn:authn:se:bankid:same-device'
  authenticationmethod: string; // e.g., 'urn:oasis:names:tc:SAML:2.0:ac:classes:SoftwarePKI'
  authenticationinstant: string; // ISO date string
  nameidentifier: string;
  sub: string; // subject (user ID)
  sessionindex: string;
  ssn: string; // Social Security Number
  name: string;
  givenname: string;
  given_name: string;
  surname: string;
  family_name: string;
  ipaddress: string;
  country: string;
  iat: number; // issued at (Unix timestamp)
  nbf: number; // not before
  exp: number; // expires at
}

/**
 * User profile from Criipto /userinfo endpoint
 */
export interface CriiptoUserProfile {
  identityscheme: string;
  authenticationtype: string;
  authenticationmethod: string;
  authenticationinstant: string;
  nameidentifier: string;
  sub: string;
  sessionindex: string;
  ssn: string;
  name: string;
  givenname: string;
  given_name: string;
  surname: string;
  family_name: string;
  ipaddress: string;
  country: string;
}

/**
 * Full authentication result after BankID login
 */
export interface CriiptoAuthResult {
  tokens: CriiptoTokens;
  claims: CriiptoIdTokenClaims;
  profile: CriiptoUserProfile;
}

export interface SsnPayload {
  ssn: string;
  given_name: string;
}
