/**
 * Shared TypeScript types for the Vinkius Desktop application.
 * These mirror the Rust structs passed via Tauri IPC.
 */

/** Discovered MCP client on the user's machine */
export interface DiscoveredClient {
  id: string
  name: string
  detected: boolean
  config_path: string | null
  version: string | null
  servers: ServerEntry[]
  restart_required: boolean
}

/** An MCP server entry within a client config */
export interface ServerEntry {
  name: string
  transport: string  // 'stdio' | 'http'
  command: string
  args: string[]
  url: string
  env: Record<string, string>
}

/** Server config for installing to clients */
export interface ServerConfig {
  name: string
  transport: string  // 'stdio' | 'http'
  command: string
  args: string[]
  url: string
  env: Record<string, string>
}

/** Result of an install operation for one client */
export interface InstallResult {
  client_id: string
  success: boolean
  error: string | null
  restart_required: boolean
}

/** Result of a remove operation for one client */
export interface RemoveResult {
  client_id: string
  success: boolean
  error: string | null
}

/** Health check result for a client config */
export interface HealthCheck {
  client_id: string
  healthy: boolean
  error: string | null
}

/** Auth session state */
export interface SessionState {
  authenticated: boolean
  user?: UserInfo
}

/** Authenticated user info */
export interface UserInfo {
  uuid: string
  name: string
  email: string
  avatar?: string
}

/** Login result — returned immediately, browser handles approval */
export interface LoginResult {
  verification_url: string
}

/** Config change event payload from Rust file watcher */
export interface ConfigChangedPayload {
  client_id: string
  servers: string[]
}

/** App settings */
export interface AppSettings {
  start_at_login: boolean
  show_in_tray: boolean
  check_for_updates: boolean
  show_notifications: boolean
  theme: 'system' | 'light' | 'dark'
}
