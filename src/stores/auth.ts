import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tauriInvoke, tauriListen } from '@/composables/useTauri'
import type { SessionState, UserInfo, LoginResult } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const authenticated = ref(false)
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const showLoginModal = ref(false)

  const userInitials = computed(() => {
    if (!user.value?.name) return '?'
    return user.value.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  async function checkSession() {
    try {
      const session = await tauriInvoke<SessionState>('get_session')
      authenticated.value = session.authenticated
      user.value = session.user ?? null
    } catch {
      authenticated.value = false
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  /**
   * Initiate Device Flow login.
   * Returns immediately with user_code + verification_url.
   * The Rust backend polls in the background and emits `auth:session-ready` on success.
   */
  async function login(): Promise<LoginResult> {
    loading.value = true
    try {
      const result = await tauriInvoke<LoginResult>('login')
      return result
    } catch (e) {
      loading.value = false
      throw e
    }
  }

  async function logout() {
    loading.value = true
    try {
      await tauriInvoke('logout')
      authenticated.value = false
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Set up Tauri event listeners for auth state changes.
   * These events are emitted by the Rust backend:
   * - `auth:session-ready`  — Device Flow polling succeeded, tokens stored
   * - `auth:expired`        — Token refresh failed, user must re-login
   * - `auth:logged-out`     — User logged out
   * - `auth:error`          — Device Flow polling failed (expired, denied, etc.)
   */
  function setupListeners() {
    tauriListen('auth:session-ready', (payload: unknown) => {
      const session = payload as SessionState
      authenticated.value = session.authenticated
      user.value = session.user ?? null
      loading.value = false
    })

    tauriListen('auth:expired', () => {
      authenticated.value = false
      user.value = null
    })

    tauriListen('auth:logged-out', () => {
      authenticated.value = false
      user.value = null
    })

    tauriListen('auth:error', (_payload: unknown) => {
      loading.value = false
    })
  }

  return {
    authenticated,
    user,
    loading,
    initialized,
    showLoginModal,
    userInitials,
    checkSession,
    login,
    logout,
    setupListeners,
  }
})
