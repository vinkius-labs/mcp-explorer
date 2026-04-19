use crate::discovery;

/// Discover all MCP clients installed on this machine.
/// Probes known filesystem paths for each supported client.
#[tauri::command]
pub fn discover_clients() -> Result<Vec<discovery::DiscoveredClient>, String> {
    discovery::engine::discover_all().map_err(|e| format!("Discovery failed: {}", e))
}
