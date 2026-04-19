#![allow(dead_code)]

/// Read and parse a JSON config file.
pub fn read_json(path: &str) -> Result<serde_json::Value, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Cannot read '{}': {}", path, e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid JSON in '{}': {}", path, e))
}

/// Validate that a config file is valid JSON and has the expected structure.
pub fn validate_config(path: &str, config_key: &str) -> Result<(), String> {
    let config = read_json(path)?;

    if !config.is_object() {
        return Err(format!("Config in '{}' is not a JSON object", path));
    }

    // The config key is optional — it's created on first install
    if let Some(servers) = config.get(config_key) {
        if !servers.is_object() {
            return Err(format!(
                "'{}' in '{}' is not an object",
                config_key, path
            ));
        }
    }

    Ok(())
}
