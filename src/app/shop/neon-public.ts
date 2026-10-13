/**
 * Public Neon endpoints for the non-production Marlow branch.
 * Neither value is a connection string. The database password stays in the gitignored `.env`.
 */
export const NEON_AUTH_URL =
  'https://ep-snowy-wind-b2kbaq9p.neonauth.c-6.eu-central-1.aws.neon.tech/neondb/auth';

export const NEON_DATA_API_URL =
  'https://ep-snowy-wind-b2kbaq9p.apirest.c-6.eu-central-1.aws.neon.tech/neondb/rest/v1';

/** Where the shop relays Neon Auth on its own domain, for browsers that refuse Neon Auth's cookie (Safari). */
export const NEON_AUTH_RELAY_PATH = '/api/auth';
