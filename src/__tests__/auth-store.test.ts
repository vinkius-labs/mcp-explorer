/**
 * Auth Store Tests
 *
 * Prevents regressions like:
 * - showLoginModal not being reactive
 * - checkSession not resetting state on failure
 * - Login flow not updating loading state
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts unauthenticated', () => {
    const auth = useAuthStore()
    expect(auth.authenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(auth.loading).toBe(false)
  })

  it('showLoginModal is reactive and starts closed', () => {
    const auth = useAuthStore()
    expect(auth.showLoginModal).toBe(false)

    auth.showLoginModal = true
    expect(auth.showLoginModal).toBe(true)
  })

  it('checkSession sets unauthenticated in browser mode (no Tauri)', async () => {
    const auth = useAuthStore()
    await auth.checkSession()

    // Browser stub returns { authenticated: false }
    expect(auth.authenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('userInitials returns ? when no user', () => {
    const auth = useAuthStore()
    expect(auth.userInitials).toBe('?')
  })

  it('login throws in browser mode', async () => {
    const auth = useAuthStore()
    await expect(auth.login()).rejects.toThrow()
  })
})
