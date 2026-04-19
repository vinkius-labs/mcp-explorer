/**
 * Vitest Global Setup
 *
 * Mocks Tauri IPC so tests can run outside the Tauri runtime
 * (pure Node / happy-dom).
 */

// Mock Tauri internals so isTauri detection returns false
// This ensures all Tauri commands use browser stubs
Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: undefined,
  writable: true,
})
