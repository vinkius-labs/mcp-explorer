import { ref } from 'vue'

/**
 * Check if running inside Tauri (desktop) or plain browser (dev mode).
 */
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// ── Event bus (browser mode — replaces Tauri events) ─────────────────

const eventHandlers: Record<string, Array<(payload: unknown) => void>> = {}

export function emitBrowserEvent(event: string, payload: unknown) {
  const handlers = eventHandlers[event] ?? []
  handlers.forEach((h) => h(payload))
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Typed wrapper with loading/error state.
 */
export function useTauri<T = unknown>() {
  const data = ref<T | null>(null) as ReturnType<typeof ref<T | null>>
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute(command: string, args?: Record<string, unknown>): Promise<T> {
    loading.value = true
    error.value = null

    try {
      const result = await tauriInvoke<T>(command, args)
      data.value = result
      return result
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}

/**
 * Invoke a Tauri command via IPC.
 *
 * - In Tauri: real IPC → Rust backend handles everything
 *   (API calls, browser opening, token storage)
 * - In browser: auth requires Tauri — returns unauthenticated state
 */
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<T>(command, args)
  }

  // Browser-only mode — Rust backend not available
  // Auth commands return safe defaults; filesystem commands return empty
  return browserStub<T>(command, args)
}

/**
 * Listen to events from the Rust backend.
 *
 * - In Tauri: real IPC events
 * - In browser: local event bus (for future use)
 */
export async function tauriListen(event: string, handler: (payload: unknown) => void) {
  if (isTauri) {
    const { listen } = await import('@tauri-apps/api/event')
    return listen(event, (e) => handler(e.payload))
  }
  // Browser: register on local event bus
  if (!eventHandlers[event]) eventHandlers[event] = []
  eventHandlers[event].push(handler)
  return () => {}
}

// ── Browser stubs (no mocks, no API calls) ───────────────────────────
// Auth is handled entirely by Rust (API calls + browser opening).
// In browser-only mode, auth simply returns "not authenticated".
// Use `npm run tauri dev` for the full authentication flow.

function browserStub<T>(command: string, _args?: Record<string, unknown>): T {
  switch (command) {
    case 'get_session':
      return { authenticated: false, user: null } as T
    case 'login':
      throw new Error('Authentication requires the desktop app. Run: npm run tauri dev')
    case 'logout':
      return undefined as T
    case 'get_access_token':
      throw new Error('Authentication requires the desktop app. Run: npm run tauri dev')

    // Filesystem commands — need Tauri IPC, return empty
    case 'discover_clients':
    case 'list_servers':
    case 'install_server':
    case 'remove_server':
    case 'check_health':
      return [] as T
    case 'get_settings':
      return {
        start_at_login: false,
        show_in_tray: true,
        check_for_updates: true,
        show_notifications: false,
        theme: 'system',
      } as T
    case 'update_settings':
    case 'sync_server':
    case 'read_config':
    case 'set_tray_visible':
      return null as T

    default:
      console.warn(`[useTauri] Command "${command}" requires Tauri runtime`)
      return null as T
  }
}
