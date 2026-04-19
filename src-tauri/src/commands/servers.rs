use serde::{Deserialize, Serialize};
use crate::config;
use crate::discovery;

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerConfig {
    pub name: String,
    /// Transport type: "stdio" or "http"
    pub transport: String,
    /// For stdio: the executable command
    pub command: String,
    /// For stdio: arguments passed to the command
    pub args: Vec<String>,
    /// For http: the server URL endpoint
    pub url: String,
    pub env: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize)]
pub struct InstallResult {
    pub client_id: String,
    pub success: bool,
    pub error: Option<String>,
    pub restart_required: bool,
}

#[derive(Debug, Serialize)]
pub struct RemoveResult {
    pub client_id: String,
    pub success: bool,
    pub error: Option<String>,
}

/// List all unique servers across all detected clients.
#[tauri::command]
pub fn list_servers() -> Result<Vec<ServerConfig>, String> {
    let clients = discovery::engine::discover_all()
        .map_err(|e| format!("Discovery failed: {}", e))?;

    let mut seen = std::collections::HashSet::new();
    let mut servers = Vec::new();

    for client in &clients {
        for server in &client.servers {
            if seen.insert(server.name.clone()) {
                servers.push(ServerConfig {
                    name: server.name.clone(),
                    transport: server.transport.clone(),
                    command: server.command.clone(),
                    args: server.args.clone(),
                    url: server.url.clone(),
                    env: server.env.clone(),
                });
            }
        }
    }

    Ok(servers)
}

/// Install a server to specific clients.
#[tauri::command]
pub fn install_server(
    server: ServerConfig,
    client_ids: Vec<String>,
) -> Result<Vec<InstallResult>, String> {
    let registry = discovery::registry::get_registry();
    let mut results = Vec::new();

    for client_id in &client_ids {
        let definition = registry.iter().find(|d| d.id == *client_id);

        let result = match definition {
            Some(def) => {
                match config::writer::install_to_client(&server, def) {
                    Ok(()) => InstallResult {
                        client_id: client_id.clone(),
                        success: true,
                        error: None,
                        restart_required: def.restart_required,
                    },
                    Err(e) => InstallResult {
                        client_id: client_id.clone(),
                        success: false,
                        error: Some(e),
                        restart_required: false,
                    },
                }
            }
            None => InstallResult {
                client_id: client_id.clone(),
                success: false,
                error: Some(format!("Unknown client: {}", client_id)),
                restart_required: false,
            },
        };

        results.push(result);
    }

    Ok(results)
}

/// Remove a server from specific clients.
#[tauri::command]
pub fn remove_server(
    server_name: String,
    client_ids: Vec<String>,
) -> Result<Vec<RemoveResult>, String> {
    let registry = discovery::registry::get_registry();
    let mut results = Vec::new();

    for client_id in &client_ids {
        let definition = registry.iter().find(|d| d.id == *client_id);

        let result = match definition {
            Some(def) => {
                match config::writer::remove_from_client(&server_name, def) {
                    Ok(()) => RemoveResult {
                        client_id: client_id.clone(),
                        success: true,
                        error: None,
                    },
                    Err(e) => RemoveResult {
                        client_id: client_id.clone(),
                        success: false,
                        error: Some(e),
                    },
                }
            }
            None => RemoveResult {
                client_id: client_id.clone(),
                success: false,
                error: Some(format!("Unknown client: {}", client_id)),
            },
        };

        results.push(result);
    }

    Ok(results)
}

/// Sync a server to all detected clients.
#[tauri::command]
pub fn sync_server(server_name: String) -> Result<(), String> {
    let clients = discovery::engine::discover_all()
        .map_err(|e| format!("Discovery failed: {}", e))?;

    // Find the server config from any client that has it
    let server_config = clients
        .iter()
        .flat_map(|c| c.servers.iter())
        .find(|s| s.name == server_name)
        .ok_or_else(|| format!("Server '{}' not found in any client", server_name))?;

    let config = ServerConfig {
        name: server_config.name.clone(),
        transport: server_config.transport.clone(),
        command: server_config.command.clone(),
        args: server_config.args.clone(),
        url: server_config.url.clone(),
        env: server_config.env.clone(),
    };

    // Install to all detected clients that don't already have it
    let registry = discovery::registry::get_registry();
    for client in &clients {
        if client.detected && !client.servers.iter().any(|s| s.name == server_name) {
            if let Some(def) = registry.iter().find(|d| d.id == client.id) {
                let _ = config::writer::install_to_client(&config, def);
            }
        }
    }

    Ok(())
}
