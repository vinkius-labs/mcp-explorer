use crate::commands::servers::ServerConfig;
use crate::discovery::registry::ClientDefinition;
use crate::discovery::resolver;
use std::fs;
use std::path::Path;

/// Install a server to a specific client config.
/// Uses atomic write (write to temp, then rename) to prevent corruption.
pub fn install_to_client(server: &ServerConfig, definition: &ClientDefinition) -> Result<(), String> {
    let path = resolver::resolve_path(definition)
        .or_else(|| resolver::resolve_writable_path(definition))
        .ok_or_else(|| format!("Cannot resolve config path for {}", definition.id))?;

    // Read existing config or create empty object
    let mut config = if Path::new(&path).exists() {
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Cannot read '{}': {}", path, e))?;
        serde_json::from_str::<serde_json::Value>(&content)
            .map_err(|e| format!("Invalid JSON in '{}': {}", path, e))?
    } else {
        // Create parent directory if needed
        if let Some(parent) = Path::new(&path).parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Cannot create directory: {}", e))?;
        }
        serde_json::json!({})
    };

    // Ensure the config key object exists
    let config_obj = config
        .as_object_mut()
        .ok_or("Config is not a JSON object")?;

    if !config_obj.contains_key(definition.config_key) {
        config_obj.insert(
            definition.config_key.to_string(),
            serde_json::json!({}),
        );
    }

    // Build the server entry based on transport type
    let mut server_entry = if server.transport == "http" && !server.url.is_empty() {
        // HTTP transport: use the client-specific URL key
        let mut entry = serde_json::Map::new();
        entry.insert(
            definition.http_url_key.to_string(),
            serde_json::Value::String(server.url.clone()),
        );

        // VS Code requires explicit "type" field
        if definition.id == "vscode" || definition.id == "vscode-insiders" {
            entry.insert("type".to_string(), serde_json::json!("http"));
        }

        serde_json::Value::Object(entry)
    } else {
        // stdio transport: command + args
        let mut entry = serde_json::json!({
            "command": server.command,
            "args": server.args,
        });

        // VS Code requires explicit "type" field
        if definition.id == "vscode" || definition.id == "vscode-insiders" {
            entry
                .as_object_mut()
                .unwrap()
                .insert("type".to_string(), serde_json::json!("stdio"));
        }

        entry
    };

    // Add env vars if any (applies to both transport types)
    if !server.env.is_empty() {
        server_entry
            .as_object_mut()
            .unwrap()
            .insert("env".to_string(), serde_json::to_value(&server.env).unwrap());
    }

    // Insert the server
    config[definition.config_key]
        .as_object_mut()
        .unwrap()
        .insert(server.name.clone(), server_entry);

    // Atomic write: write to temp file, then rename
    atomic_write(&path, &config)
}

/// Remove a server from a specific client config.
pub fn remove_from_client(server_name: &str, definition: &ClientDefinition) -> Result<(), String> {
    let path = resolver::resolve_path(definition)
        .ok_or_else(|| format!("Config not found for {}", definition.id))?;

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read '{}': {}", path, e))?;

    let mut config: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid JSON in '{}': {}", path, e))?;

    // Remove the server entry
    if let Some(servers) = config
        .get_mut(definition.config_key)
        .and_then(|v| v.as_object_mut())
    {
        servers.remove(server_name);
    }

    // Atomic write
    atomic_write(&path, &config)
}

/// Write JSON to a file atomically: write to a temp file, then rename over the target.
fn atomic_write(path: &str, value: &serde_json::Value) -> Result<(), String> {
    let formatted = serde_json::to_string_pretty(value)
        .map_err(|e| format!("JSON serialization error: {}", e))?;

    let temp_path = format!("{}.tmp", path);

    fs::write(&temp_path, &formatted)
        .map_err(|e| format!("Cannot write temp file '{}': {}", temp_path, e))?;

    fs::rename(&temp_path, path)
        .map_err(|e| format!("Cannot rename temp file: {}", e))?;

    Ok(())
}
