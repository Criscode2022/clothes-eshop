/**
 * Public Neon endpoints for the non-production Marlow branch.
 * Neither value is a connection string. The database password stays in the gitignored `.env`.
 */
export const NEON_AUTH_URL =
  'https://ep-snowy-wind-b2kbaq9p.neonauth.c-6.eu-central-1.aws.neon.tech/neondb/auth';

export const NEON_DATA_API_URL =
  'https://ep-snowy-wind-b2kbaq9p.apirest.c-6.eu-central-1.aws.neon.tech/neondb/rest/v1';
