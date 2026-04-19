use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, Manager,
};

/// Tray icon ID — used to retrieve the tray later for show/hide.
pub const TRAY_ID: &str = "main-tray";

/// Create and configure the system tray icon with a right-click menu.
pub fn create_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let open = MenuItem::with_id(app, "open", "Open Vinkius Desktop", true, None::<&str>)?;
    let check_updates = MenuItem::with_id(app, "check_updates", "Check for updates", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open, &check_updates, &quit])?;

    let _tray = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        .tooltip("Vinkius Desktop")
        .on_menu_event(move |app, event| {
            match event.id.as_ref() {
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "check_updates" => {
                    // Update checking logic will be implemented here
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

/// Show or hide the system tray icon.
#[tauri::command]
pub fn set_tray_visible(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "Tray icon not found".to_string())?;

    tray.set_visible(visible).map_err(|e| e.to_string())
}
