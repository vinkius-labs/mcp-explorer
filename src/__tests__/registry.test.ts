/**
 * Registry Tests
 *
 * Prevents regressions like:
 * - Accidentally exposing competitor names
 * - Breaking the default provider
 * - Missing required provider fields
 */

import { describe, it, expect } from 'vitest'
import { getAllProviders, getDefaultProvider } from '@/mcp-providers/registry'

describe('MCP Provider Registry', () => {
  const providers = getAllProviders()
  const defaultProvider = getDefaultProvider()

  it('returns a non-empty list of providers', () => {
    expect(providers.length).toBeGreaterThanOrEqual(1)
  })

  it('has Vinkius as the default integrated provider', () => {
    expect(defaultProvider.kind).toBe('integrated')
    expect(defaultProvider.id).toBe('vinkius')
    expect(defaultProvider.name).toBe('Vinkius')
  })

  it('default provider has required fields', () => {
    expect(defaultProvider.siteUrl).toBeTruthy()
    expect(defaultProvider.routePath).toBeTruthy()
    expect(defaultProvider.marketplace).toBeTruthy()
  })

  it('does NOT contain competitor names', () => {
    const names = providers.map((p) => p.name.toLowerCase())
    const ids = providers.map((p) => p.id.toLowerCase())
    const all = [...names, ...ids]

    const competitors = [
      'smithery', 'glama', 'composio', 'pulsemcp',
      'mcp.so', 'mcpservers', 'openai', 'anthropic',
    ]

    for (const competitor of competitors) {
      expect(all).not.toContain(competitor)
    }
  })

  it('all providers have unique IDs', () => {
    const ids = providers.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('external providers have valid site URLs', () => {
    for (const p of providers) {
      if (p.kind === 'external') {
        expect(p.siteUrl).toMatch(/^https?:\/\//)
      }
    }
  })
})
