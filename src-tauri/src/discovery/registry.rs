/// Client definition — describes where to find a client's MCP config.
pub struct ClientDefinition {
    pub id: &'static str,
    pub name: &'static str,
    /// Config key under which MCP servers are listed
    pub config_key: &'static str,
    /// JSON key used for HTTP server URLs (e.g., "url", "serverUrl", "endpoint")
    pub http_url_key: &'static str,
    /// Whether the client needs restart after config changes
    pub restart_required: bool,
    /// Platform-specific candidate paths
    pub paths: PlatformPaths,
}

#[allow(dead_code)]
pub struct PlatformPaths {
    pub darwin: &'static [&'static str],
    pub linux: &'static [&'static str],
    pub win32: &'static [&'static str],
}

/// Returns the full registry of known MCP client definitions.
pub fn get_registry() -> Vec<ClientDefinition> {
    vec![
        ClientDefinition {
            id: "claude",
            name: "Claude Desktop",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: true,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Claude/claude_desktop_config.json"],
                linux: &["~/.config/claude/claude_desktop_config.json"],
                win32: &["%APPDATA%\\Claude\\claude_desktop_config.json"],
            },
        },
        ClientDefinition {
            id: "cursor",
            name: "Cursor",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.cursor/mcp.json"],
                linux: &["~/.cursor/mcp.json"],
                win32: &["%USERPROFILE%\\.cursor\\mcp.json"],
            },
        },
        ClientDefinition {
            id: "vscode",
            name: "VS Code",
            config_key: "servers", // VS Code uses "servers" as the root key in its mcp.json file
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Code/User/mcp.json", "~/.vscode/mcp.json"],
                linux: &["~/.config/Code/User/mcp.json", "~/.vscode/mcp.json"],
                win32: &["%APPDATA%\\Code\\User\\mcp.json", "%USERPROFILE%\\.vscode\\mcp.json"],
            },
        },
        ClientDefinition {
            id: "vscode-insiders",
            name: "VS Code Insiders",
            config_key: "servers", // VS Code Insiders uses "servers" as the root key in its mcp.json file
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Code - Insiders/User/mcp.json", "~/.vscode-insiders/mcp.json"],
                linux: &["~/.config/Code - Insiders/User/mcp.json", "~/.vscode-insiders/mcp.json"],
                win32: &["%APPDATA%\\Code - Insiders\\User\\mcp.json", "%USERPROFILE%\\.vscode-insiders\\mcp.json"],
            },
        },
        ClientDefinition {
            id: "windsurf",
            name: "Windsurf",
            config_key: "mcpServers",
            http_url_key: "serverUrl",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.codeium/windsurf/mcp_config.json"],
                linux: &["~/.codeium/windsurf/mcp_config.json"],
                win32: &["%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json"],
            },
        },
        ClientDefinition {
            id: "continue",
            name: "Continue.dev",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.continue/config.json"],
                linux: &["~/.continue/config.json"],
                win32: &["%USERPROFILE%\\.continue\\config.json"],
            },
        },
        ClientDefinition {
            id: "copilot",
            name: "GitHub Copilot",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.copilot/mcp-config.json"],
                linux: &["~/.copilot/mcp-config.json"],
                win32: &["%USERPROFILE%\\.copilot\\mcp-config.json"],
            },
        },
        ClientDefinition {
            id: "gemini",
            name: "Gemini CLI",
            config_key: "mcpServers",
            http_url_key: "serverUrl",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.gemini/settings.json"],
                linux: &["~/.gemini/settings.json"],
                win32: &["%USERPROFILE%\\.gemini\\settings.json"],
            },
        },
        ClientDefinition {
            id: "jetbrains",
            name: "JetBrains",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.idea/mcp.json"],
                linux: &["~/.idea/mcp.json"],
                win32: &["%USERPROFILE%\\.idea\\mcp.json"],
            },
        },
        ClientDefinition {
            id: "antigravity",
            name: "Google Antigravity",
            config_key: "mcpServers",
            http_url_key: "serverUrl",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.gemini/antigravity/mcp_config.json"],
                linux: &["~/.gemini/antigravity/mcp_config.json"],
                win32: &["%USERPROFILE%\\.gemini\\antigravity\\mcp_config.json"],
            },
        },
        ClientDefinition {
            id: "goose",
            name: "Goose by Block",
            config_key: "extensions", // Goose uses "extensions" as the root YAML key
            http_url_key: "endpoint",
            restart_required: true,
            paths: PlatformPaths {
                darwin: &["~/.config/goose/config.yaml"],
                linux: &["~/.config/goose/config.yaml"],
                win32: &["%APPDATA%\\goose\\config.yaml", "%APPDATA%\\Block\\goose\\config\\config.yaml"],
            },
        },
        ClientDefinition {
            id: "cline",
            name: "Cline",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"],
                linux: &["~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"],
                win32: &["%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json"],
            },
        },
        ClientDefinition {
            id: "cline-insiders",
            name: "Cline (Insiders)",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Code - Insiders/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"],
                linux: &["~/.config/Code - Insiders/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"],
                win32: &["%APPDATA%\\Code - Insiders\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json"],
            },
        },
        ClientDefinition {
            id: "roo-code",
            name: "Roo Code",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"],
                linux: &["~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"],
                win32: &["%APPDATA%\\Code\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json"],
            },
        },
        ClientDefinition {
            id: "roo-code-insiders",
            name: "Roo Code (Insiders)",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/Library/Application Support/Code - Insiders/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"],
                linux: &["~/.config/Code - Insiders/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"],
                win32: &["%APPDATA%\\Code - Insiders\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline_mcp_settings.json"],
            },
        },
        ClientDefinition {
            id: "claude-code",
            name: "Claude Code",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.claude.json"],
                linux: &["~/.claude.json"],
                win32: &["%USERPROFILE%\\.claude.json"],
            },
        },
        ClientDefinition {
            id: "openclaw",
            name: "OpenClaw",
            config_key: "mcpServers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.openclaw/openclaw.json"],
                linux: &["~/.openclaw/openclaw.json"],
                win32: &["%USERPROFILE%\\.openclaw\\openclaw.json"],
            },
        },
        ClientDefinition {
            id: "codex",
            name: "Codex",
            config_key: "mcp_servers",
            http_url_key: "url",
            restart_required: false,
            paths: PlatformPaths {
                darwin: &["~/.codex/config.toml"],
                linux: &["~/.codex/config.toml"],
                win32: &["%USERPROFILE%\\.codex\\config.toml"],
            },
        },
    ]
}
