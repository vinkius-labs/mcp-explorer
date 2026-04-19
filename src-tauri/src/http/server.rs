// Localhost HTTP server for web marketplace integration.
//
// Runs on port 9315 and exposes:
// - GET  /ping     — Check if desktop app is running
// - POST /install  — Install a server from the web marketplace
// - GET  /discover — List detected clients
//
// The server will be started from lib.rs setup when ready.

/// Start the localhost HTTP server on port 9315.
pub fn _start_server(_app_handle: tauri::AppHandle) {
    // Will use axum to expose endpoints
}
