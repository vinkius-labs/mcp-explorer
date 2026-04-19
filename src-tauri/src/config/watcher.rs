use crate::discovery::registry;
use crate::discovery::resolver;
use notify::{Watcher, RecursiveMode};
use std::path::Path;
use tauri::Emitter;

/// Start watching all detected client config files for external changes.
/// Emits 'config-changed' events to the frontend when changes are detected.
pub fn start_watching(app_handle: tauri::AppHandle) -> Result<(), String> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
        if let Ok(event) = res {
            let _ = tx.send(event);
        }
    })
    .map_err(|e| format!("Failed to create file watcher: {}", e))?;

    // Watch all known config file paths
    let reg = registry::get_registry();
    for definition in &reg {
        if let Some(path) = resolver::resolve_path(definition) {
            let p = Path::new(&path);
            if let Some(parent) = p.parent() {
                // Watch the parent directory to catch file creation
                let _ = watcher.watch(parent, RecursiveMode::NonRecursive);
            }
        }
    }

    // Process events
    while let Ok(event) = rx.recv() {
        if matches!(
            event.kind,
            notify::EventKind::Modify(_) | notify::EventKind::Create(_)
        ) {
            // Emit config-changed event to frontend
            let _ = app_handle.emit("config-changed", ());
        }
    }

    Ok(())
}
