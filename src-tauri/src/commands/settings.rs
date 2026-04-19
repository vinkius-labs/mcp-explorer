use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub start_at_login: bool,
    pub show_in_tray: bool,
    pub check_for_updates: bool,
    pub show_notifications: bool,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            start_at_login: false,
            show_in_tray: true,
            check_for_updates: true,
            show_notifications: false,
            theme: "system".into(),
        }
    }
}

use tauri_plugin_store::StoreExt;
use tauri_plugin_autostart::ManagerExt;
use serde_json::json;

/// Get current app settings.
#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    
    let mut settings = AppSettings::default();

    if let Some(b) = store.get("start_at_login").and_then(|v| v.as_bool()) { settings.start_at_login = b; }
    if let Some(b) = store.get("show_in_tray").and_then(|v| v.as_bool()) { settings.show_in_tray = b; }
    if let Some(b) = store.get("check_for_updates").and_then(|v| v.as_bool()) { settings.check_for_updates = b; }
    if let Some(b) = store.get("show_notifications").and_then(|v| v.as_bool()) { settings.show_notifications = b; }
    if let Some(s) = store.get("theme").and_then(|v| v.as_str().map(String::from)) { settings.theme = s; }

    Ok(settings)
}

/// Update app settings.
#[tauri::command]
pub fn update_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    // 1. Save to Tauri Store
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set("start_at_login", json!(settings.start_at_login));
    store.set("show_in_tray", json!(settings.show_in_tray));
    store.set("check_for_updates", json!(settings.check_for_updates));
    store.set("show_notifications", json!(settings.show_notifications));
    store.set("theme", json!(settings.theme));
    let _ = store.save();

    // 2. Manage Autostart (OS integration)
    if settings.start_at_login {
        let _ = app.autolaunch().enable();
    } else {
        let _ = app.autolaunch().disable();
    }

    // 3. Manage Tray visibility instantly
    let _ = crate::tray::set_tray_visible(app, settings.show_in_tray);

    Ok(())
}
