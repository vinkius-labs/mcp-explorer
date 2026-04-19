use super::{DiscoveredClient, ServerEntry};
use super::registry;
use super::resolver;
use std::collections::HashMap;

/// Discover all registered MCP clients on this machine.
/// For each client, probes the filesystem and extracts server entries.
pub fn discover_all() -> Result<Vec<DiscoveredClient>, String> {
    let registry = registry::get_registry();
    let mut results = Vec::new();

    for definition in &registry {
        let resolved_path = resolver::resolve_path(definition);
        let writable_path = resolver::resolve_writable_path(definition);

        let mut is_installed = false;
        if resolved_path.is_some() {
            is_installed = true;
        } else if let Some(ref wp) = writable_path {
            // Only perform folder-based detection for heavy IDEs that don't natively generate the mcp file on install
            let id = definition.id;
            let folder_fallback_allowed = id == "vscode" 
                || id == "vscode-insiders" 
                || id == "cursor" 
                || id == "windsurf" 
                || id == "jetbrains";

            if folder_fallback_allowed {
                let pbuf = std::path::PathBuf::from(wp);
                if let Some(parent) = pbuf.parent() {
                    if let Some(home) = dirs::home_dir() {
                        let is_home = parent.as_os_str() == home.as_os_str();
                        let parent_str = parent.to_string_lossy();
                        let is_roaming = parent_str.ends_with("Roaming");
                        
                        if !is_home && !is_roaming {
                            is_installed = parent.exists();
                        }
                    }
                }
            }
        }

        let client = if let Some(ref path) = resolved_path {
            // Config file found — parse it
            match parse_client_config(path, definition.config_key) {
                Ok(servers) => DiscoveredClient {
                    id: definition.id.to_string(),
                    name: definition.name.to_string(),
                    detected: is_installed,
                    config_path: Some(path.clone()),
                    version: None,
                    servers,
                    restart_required: definition.restart_required,
                },
                Err(_) => DiscoveredClient {
                    id: definition.id.to_string(),
                    name: definition.name.to_string(),
                    detected: is_installed,
                    config_path: Some(path.clone()),
                    version: None,
                    servers: vec![],
                    restart_required: definition.restart_required,
                },
            }
        } else {
            // Config file not found — client might still be installed
            DiscoveredClient {
                id: definition.id.to_string(),
                name: definition.name.to_string(),
                detected: is_installed,
                config_path: writable_path, // Provide where it SHOULD be written
                version: None,
                servers: vec![],
                restart_required: definition.restart_required,
            }
        };

        results.push(client);
    }

    Ok(results)
}

/// Parse a client config file and extract MCP server entries.
fn parse_client_config(
    path: &str,
    config_key: &str,
) -> Result<Vec<ServerEntry>, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Cannot read {}: {}", path, e))?;

    let config: serde_json::Value = if path.ends_with(".yaml") || path.ends_with(".yml") {
        serde_yaml::from_str(&content)
            .map_err(|e| format!("Invalid YAML in {}: {}", path, e))?
    } else if path.ends_with(".toml") {
        toml::from_str(&content)
            .map_err(|e| format!("Invalid TOML in {}: {}", path, e))?
    } else {
        serde_json::from_str(&content)
            .map_err(|e| format!("Invalid JSON in {}: {}", path, e))?
    };

    // Traverse the config_key which might use dot notation, e.g., "mcp.servers"
    let mut current_val = &config;
    for part in config_key.split('.') {
        match current_val.get(part) {
            Some(v) => current_val = v,
            None => return Ok(vec![]),
        }
    }

    let servers_obj = match current_val {
        serde_json::Value::Object(obj) => obj,
        _ => return Ok(vec![]),
    };

    let mut servers = Vec::new();

    for (name, value) in servers_obj {
        // Detect transport type by checking for URL fields first
        let url = value
            .get("url")
            .or_else(|| value.get("serverUrl"))
            .or_else(|| value.get("endpoint"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let is_http = !url.is_empty();

        let command = value
            .get("command")
            .or_else(|| value.get("cmd")) // Fallback for Goose
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let args: Vec<String> = value
            .get("args")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();

        let env: HashMap<String, String> = value
            .get("env")
            .or_else(|| value.get("envs")) // Fallback for Goose
            .and_then(|v| v.as_object())
            .map(|obj| {
                obj.iter()
                    .filter_map(|(k, v)| {
                        v.as_str().map(|val| (k.clone(), val.to_string()))
                    })
                    .collect()
            })
            .unwrap_or_default();

        let transport = if is_http {
            "http".to_string()
        } else {
            "stdio".to_string()
        };

        servers.push(ServerEntry {
            name: name.clone(),
            transport,
            command,
            args,
            url,
            env,
        });
    }

    Ok(servers)
}
