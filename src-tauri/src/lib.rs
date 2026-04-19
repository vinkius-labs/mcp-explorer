mod commands;
mod config;
mod discovery;
mod http;
mod tray;

use commands::auth::AuthState;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // When a second instance is spawned (e.g. by a deep link on Windows/Linux),
            // the OS passes the URL as a CLI argument. Forward it to our handler.
            if let Some(url) = argv.iter().find(|a| a.starts_with("vinkius://")) {
                handle_deep_link(app, url.clone());
            }
        }))
        // Shared auth state — allows deep link handler to access pending device_code
        .manage(AuthState::default())
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::get_session,
            commands::auth::get_access_token,
            commands::auth::login,
            commands::auth::logout,
            // Discovery
            commands::discover::discover_clients,
            // Servers
            commands::servers::list_servers,
            commands::servers::install_server,
            commands::servers::remove_server,
            commands::servers::sync_server,
            // Introspection
            commands::introspect::introspect_server,
            // Config
            commands::config::read_config,
            commands::config::check_health,
            // Settings
            commands::settings::get_settings,
            commands::settings::update_settings,
            // Tray
            tray::set_tray_visible,
        ])
        .setup(|app| {
            // Register deep link handler for macOS (receives URL directly)
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            {
                let handle = app.handle().clone();
                app.listen("deep-link://new-url", move |event| {
                    if let Some(urls) = event.payload().as_ref() {
                        // payload is a JSON array of strings
                        if let Ok(parsed) = serde_json::from_str::<Vec<String>>(urls) {
                            if let Some(url) = parsed.into_iter().find(|u| u.starts_with("vinkius://")) {
                                handle_deep_link(&handle, url);
                            }
                        }
                    }
                });
            }

            // Set up system tray
            tray::create_tray(app)?;

            // Start file watcher for config changes
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                if let Err(e) = config::watcher::start_watching(app_handle) {
                    log::error!("File watcher failed: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Vinkius Desktop");
}

// ── Deep Link Handler ────────────────────────────────────────────────

/// Handle incoming `vinkius://` deep link URLs.
///
/// When the user authorizes in the browser, the Cloud backend redirects to:
///   `vinkius://auth/callback`
///
/// This handler:
///   1. Reads the pending `device_code` from `AuthState`
///   2. Cancels the background polling task
///   3. Exchanges the device_code for tokens (single attempt)
///   4. Completes the auth flow (save tokens, fetch user, emit event)
///
/// If the deep link arrives before the user has authorized, the exchange
/// will fail gracefully and the polling fallback continues.
fn handle_deep_link(app: &tauri::AppHandle, url: String) {
    log::info!("Deep link received: {}", url);

    // Only handle auth callbacks
    if !url.starts_with("vinkius://auth/callback") {
        return;
    }

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let auth_state = app.state::<AuthState>();
        let pending = {
            let guard = auth_state.pending.lock().await;
            guard.as_ref().map(|p| (p.device_code.clone(), p.cancel.clone()))
        };

        let Some((device_code, cancel_token)) = pending else {
            log::warn!("Deep link received but no pending auth flow");
            return;
        };

        // Cancel the polling task immediately
        cancel_token.cancel();

        // Exchange device_code for tokens
        match commands::auth::exchange_device_code(&device_code).await {
            Ok(tokens) => {
                log::info!("Deep link: token exchange successful");
                commands::auth::complete_auth_flow(&app, tokens).await;
            }
            Err(e) => {
                log::error!("Deep link: token exchange failed: {}", e);
                // Polling is already cancelled, emit error
                let _ = app.emit("auth:error", format!("Deep link auth failed: {}", e));
            }
        }

        // Clear pending state
        let mut guard = auth_state.pending.lock().await;
        *guard = None;
    });
}
