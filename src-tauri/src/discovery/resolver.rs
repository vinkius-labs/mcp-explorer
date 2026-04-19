use super::registry::ClientDefinition;
use std::path::PathBuf;

/// Resolve the first existing config path for a client definition on the current platform.
pub fn resolve_path(definition: &ClientDefinition) -> Option<String> {
    let candidates = get_platform_paths(definition);

    for candidate in candidates {
        let expanded = expand_path(candidate);
        if let Some(path) = expanded {
            if path.exists() {
                return Some(path.to_string_lossy().to_string());
            }
        }
    }

    None
}

/// Get the first candidate path (for writing — may not exist yet).
pub fn resolve_writable_path(definition: &ClientDefinition) -> Option<String> {
    let candidates = get_platform_paths(definition);
    candidates.first().and_then(|c| {
        expand_path(c).map(|p| p.to_string_lossy().to_string())
    })
}

/// Get platform-specific candidate paths.
fn get_platform_paths(definition: &ClientDefinition) -> &[&str] {
    #[cfg(target_os = "macos")]
    { definition.paths.darwin }

    #[cfg(target_os = "linux")]
    { definition.paths.linux }

    #[cfg(target_os = "windows")]
    { definition.paths.win32 }
}

/// Expand ~ and environment variables in a path string.
fn expand_path(path: &str) -> Option<PathBuf> {
    let expanded = if path.starts_with('~') {
        let home = dirs::home_dir()?;
        home.join(&path[2..]) // skip "~/"
    } else if path.contains('%') {
        expand_env_vars(path)?
    } else {
        PathBuf::from(path)
    };

    Some(expanded)
}

/// Expand Windows-style environment variables like %APPDATA%.
fn expand_env_vars(path: &str) -> Option<PathBuf> {
    let mut result = path.to_string();

    // Find all %VAR% patterns and expand them
    while let Some(start) = result.find('%') {
        let rest = &result[start + 1..];
        if let Some(end) = rest.find('%') {
            let var_name = &rest[..end];
            let var_value = std::env::var(var_name).ok()?;
            result = format!(
                "{}{}{}",
                &result[..start],
                var_value,
                &rest[end + 1..]
            );
        } else {
            break;
        }
    }

    Some(PathBuf::from(result))
}
