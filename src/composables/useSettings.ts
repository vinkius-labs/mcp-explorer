import { ref } from 'vue'
import { isTauri } from '@/composables/useTauri'
import type { AppSettings } from '@/types'

const SETTINGS_KEY = 'vinkius:settings'
const STORE_PATH = 'settings.json'

const defaults: AppSettings = {
  start_at_login: false,
  show_in_tray: true,
  check_for_updates: true,
  show_notifications: false,
  theme: 'system',
}

// Singleton reactive state — shared across all consumers
const settings = ref<AppSettings>({ ...defaults })
const loaded = ref(false)

/**
 * Load settings from tauri-plugin-store (Tauri) or localStorage (browser).
 */
async function load(): Promise<void> {
  if (loaded.value) return

  if (isTauri) {
    try {
      const { load: loadStore } = await import('@tauri-apps/plugin-store')
      const store = await loadStore(STORE_PATH)
      const raw = await store.get<AppSettings>('settings')
      if (raw) {
        settings.value = { ...defaults, ...raw }
      }
    } catch (e) {
      console.warn('[useSettings] Failed to load from store, using defaults:', e)
    }
  } else {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        settings.value = { ...defaults, ...JSON.parse(raw) }
      }
    } catch {
      // Use defaults
    }
  }

  loaded.value = true
}

/**
 * Save current settings to tauri-plugin-store or localStorage.
 */
async function save(): Promise<void> {
  if (isTauri) {
    try {
      const { load: loadStore } = await import('@tauri-apps/plugin-store')
      const store = await loadStore(STORE_PATH)
      await store.set('settings', { ...settings.value })
      await store.save()
    } catch (e) {
      console.error('[useSettings] Failed to save to store:', e)
    }
  } else {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  }
}

/**
 * Apply autostart via tauri-plugin-autostart.
 */
async function applyAutostart(enabled: boolean): Promise<void> {
  if (!isTauri) return

  try {
    const { enable, disable } = await import('@tauri-apps/plugin-autostart')
    if (enabled) {
      await enable()
    } else {
      await disable()
    }
  } catch (e) {
    console.error('[useSettings] Failed to toggle autostart:', e)
  }
}

/**
 * Sync autostart state from the OS.
 */
async function syncAutostart(): Promise<void> {
  if (!isTauri) return

  try {
    const { isEnabled } = await import('@tauri-apps/plugin-autostart')
    settings.value.start_at_login = await isEnabled()
  } catch {
    // Plugin not available
  }
}

/**
 * Apply tray visibility via Tauri command.
 */
async function applyTrayVisibility(visible: boolean): Promise<void> {
  if (!isTauri) return

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_tray_visible', { visible })
  } catch (e) {
    console.error('[useSettings] Failed to set tray visibility:', e)
  }
}

/**
 * Apply theme to DOM.
 */
function applyTheme(theme: string): void {
  const el = document.querySelector('[data-theme-root]')
  if (!el) return

  const isDark = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : theme === 'dark'

  el.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('dark', isDark)
}

/**
 * Composable: provides reactive settings with automatic persistence.
 */
export function useSettings() {
  return {
    settings,
    loaded,

    async init() {
      await load()
      applyTheme(settings.value.theme)
      await syncAutostart()
      await applyTrayVisibility(settings.value.show_in_tray)

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (settings.value.theme === 'system') {
          applyTheme('system')
        }
      })
    },

    async setTheme(theme: 'system' | 'light' | 'dark') {
      settings.value.theme = theme
      applyTheme(theme)
      await save()
    },

    async setStartAtLogin(val: boolean) {
      settings.value.start_at_login = val
      await save()
      await applyAutostart(val)
    },

    async setShowInTray(val: boolean) {
      settings.value.show_in_tray = val
      await save()
      await applyTrayVisibility(val)
    },
  }
}
