/**
 * Vinkius Desktop — Application Configuration
 *
 * All app-level constants live here. No .env files needed.
 */
export const config = {
  /** Vinkius Cloud API */
  apiBaseUrl: 'https://api.vinkius.com',

  /** Vinkius Cloud Frontend */
  appBaseUrl: 'https://cloud.vinkius.com',

  /** Vinkius Public Website */
  siteBaseUrl: 'https://vinkius.com',
} as const
