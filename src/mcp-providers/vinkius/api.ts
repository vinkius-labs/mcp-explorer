/**
 * Vinkius Cloud — API Client
 *
 * Every outbound HTTP request to the Vinkius Cloud backend flows through
 * this module, ensuring a single source of truth for base URL resolution
 * and request configuration.
 *
 * Uses the Tauri HTTP plugin (`@tauri-apps/plugin-http`) to make requests
 * from the Rust side, completely bypassing WebView CORS restrictions.
 */

import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { config } from '@/config/app'

/**
 * Perform a typed fetch against the Vinkius Cloud API.
 *
 * Uses the Tauri HTTP plugin to make requests from the Rust side,
 * bypassing WebView CORS restrictions entirely.
 *
 * @param path - API path relative to the base URL (e.g. `/marketplace/listings`)
 * @param init - Standard `RequestInit` options (headers, method, body, etc.)
 * @returns Parsed JSON response of type `T`
 * @throws {Error} On non-2xx responses or network failures
 *
 * @example
 * ```ts
 * const data = await apiFetch<{ data: Listing[] }>('/marketplace/listings')
 * ```
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`

  const response = await tauriFetch(url, {
    ...init,
    headers: {
      'Accept': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let serverMessage = response.statusText
    try {
      const body = await response.json()
      if (body?.message) serverMessage = body.message
    } catch { /* not JSON — use statusText */ }
    throw new Error(serverMessage)
  }

  return response.json()
}

/**
 * Perform an authenticated fetch against the Vinkius Cloud API.
 *
 * Retrieves a valid access token from the Rust backend (auto-refreshes if
 * expired) and attaches it as a `Bearer` authorization header.
 *
 * @param path - API path relative to the base URL (e.g. `/marketplace/listings`)
 * @param init - Standard `RequestInit` options (headers, method, body, etc.)
 * @returns Parsed JSON response of type `T`
 * @throws {Error} On auth failure, non-2xx responses, or network failures
 */
export async function apiFetchAuthenticated<T>(path: string, init?: RequestInit): Promise<T> {
  const { tauriInvoke } = await import('@/composables/useTauri')
  const token = await tauriInvoke<string>('get_access_token')

  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      'Authorization': `Bearer ${token}`,
    },
  })
}

/** The resolved API base URL (read-only). */
export const apiBaseUrl: string = config.apiBaseUrl
