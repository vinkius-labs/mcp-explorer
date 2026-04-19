use serde::Serialize;
use crate::discovery;

#[derive(Debug, Serialize)]
pub struct HealthCheck {
    pub client_id: String,
    pub healthy: bool,
    pub error: Option<String>,
}

/// Read the raw config of a specific client.
#[tauri::command]
pub fn read_config(client_id: String) -> Result<serde_json::Value, String> {
    let registry = discovery::registry::get_registry();
    let definition = registry
        .iter()
        .find(|d| d.id == client_id)
        .ok_or_else(|| format!("Unknown client: {}", client_id))?;

    let path = discovery::resolver::resolve_path(definition)
        .ok_or_else(|| format!("Config path not found for {}", client_id))?;

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read config: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid JSON in config: {}", e))
}

/// Check the health of all detected client configs.
#[tauri::command]
pub fn check_health() -> Result<Vec<HealthCheck>, String> {
    let clients = discovery::engine::discover_all()
        .map_err(|e| format!("Discovery failed: {}", e))?;

    let mut results = Vec::new();

    for client in &clients {
        if !client.detected {
            continue;
        }

        let health = if let Some(ref path) = client.config_path {
            match std::fs::read_to_string(path) {
                Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(_) => HealthCheck {
                        client_id: client.id.clone(),
                        healthy: true,
                        error: None,
                    },
                    Err(e) => HealthCheck {
                        client_id: client.id.clone(),
                        healthy: false,
                        error: Some(format!("Invalid JSON: {}", e)),
                    },
                },
                Err(e) => HealthCheck {
                    client_id: client.id.clone(),
                    healthy: false,
                    error: Some(format!("Cannot read file: {}", e)),
                },
            }
        } else {
            HealthCheck {
                client_id: client.id.clone(),
                healthy: false,
                error: Some("Config path not found".into()),
            }
        };

        results.push(health);
    }

    Ok(results)
}
