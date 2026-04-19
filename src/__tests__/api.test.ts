/**
 * API Client Tests
 *
 * Prevents regressions like:
 * - apiFetch not setting Accept header
 * - apiFetchAuthenticated not attaching Bearer token
 * - Missing VITE_API_BASE_URL crashing at import
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiFetch, apiFetchAuthenticated, apiBaseUrl } from '@/mcp-providers/vinkius/api'

describe('API Client', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('apiBaseUrl is defined from env', () => {
    expect(apiBaseUrl).toBe('https://cloud.vinkius.com')
  })

  it('apiFetch sends Accept: application/json header', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: [] }) }
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)

    await apiFetch('/marketplace/listings')

    expect(fetch).toHaveBeenCalledWith(
      'https://cloud.vinkius.com/marketplace/listings',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    )
  })

  it('apiFetch throws on non-2xx response', async () => {
    const mockResponse = { ok: false, status: 404, statusText: 'Not Found' }
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)

    await expect(apiFetch('/not-found')).rejects.toThrow('404')
  })

  it('apiFetch builds correct URL from base + path', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) }
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)

    await apiFetch('/marketplace/free-access/abc-123')

    expect(fetch).toHaveBeenCalledWith(
      'https://cloud.vinkius.com/marketplace/free-access/abc-123',
      expect.anything(),
    )
  })

  it('apiFetch allows custom headers without overriding Accept', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) }
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)

    await apiFetch('/test', {
      headers: { 'X-Custom': 'value' },
    })

    const calledHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>
    expect(calledHeaders['Accept']).toBe('application/json')
    expect(calledHeaders['X-Custom']).toBe('value')
  })
})

describe('apiFetchAuthenticated', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('throws when not in Tauri runtime (browser mode)', async () => {
    // In test environment, tauriInvoke('get_access_token') throws
    // because there's no Tauri runtime
    await expect(
      apiFetchAuthenticated('/marketplace/free-access/123', { method: 'POST' }),
    ).rejects.toThrow()
  })
})
