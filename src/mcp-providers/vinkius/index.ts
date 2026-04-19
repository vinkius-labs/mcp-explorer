/**
 * Vinkius Cloud — Provider Definition
 *
 * Registers Vinkius as an integrated MCP marketplace provider.
 * This is the default provider used by the Dashboard, search, and
 * app detail views.
 */

import type { IntegratedProvider } from '../types'
import { createMarketplace } from './marketplace'
import { config } from '@/config/app'

/** Vinkius Cloud — the default integrated MCP marketplace provider. */
export const vinkiusProvider: IntegratedProvider = {
  kind: 'integrated',
  id: 'vinkius',
  name: 'Vinkius',
  siteUrl: config.siteBaseUrl,
  routePath: '/dashboard',
  marketplace: createMarketplace(),
}
