pub mod engine;
pub mod registry;
pub mod resolver;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A discovered MCP client on the user's machine.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscoveredClient {
    pub id: String,
    pub name: String,
    pub detected: bool,
    pub config_path: Option<String>,
    pub version: Option<String>,
    pub servers: Vec<ServerEntry>,
    pub restart_required: bool,
}

/// An MCP server entry within a client configuration.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerEntry {
    pub name: String,
    /// Transport type: "stdio" or "http"
    pub transport: String,
    /// For stdio: the executable command (e.g., "npx", "node", "python")
    pub command: String,
    /// For stdio: arguments passed to the command
    pub args: Vec<String>,
    /// For http: the server URL endpoint
    pub url: String,
    pub env: HashMap<String, String>,
}
