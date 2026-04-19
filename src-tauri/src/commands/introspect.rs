use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::time::Duration;

// ── Response types ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntrospectionResult {
    pub tools: Vec<McpTool>,
    pub resources: Vec<McpResource>,
    pub prompts: Vec<McpPrompt>,
    pub server_info: Option<ServerInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpTool {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "inputSchema")]
    pub input_schema: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpResource {
    pub uri: String,
    pub name: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpPrompt {
    pub name: String,
    pub description: Option<String>,
    pub arguments: Option<Vec<PromptArgument>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptArgument {
    pub name: String,
    pub description: Option<String>,
    pub required: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInfo {
    pub name: Option<String>,
    pub version: Option<String>,
}

// ── JSON-RPC helpers ────────────────────────────────────────────────

fn jsonrpc_request(id: u64, method: &str, params: serde_json::Value) -> String {
    serde_json::json!({
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params,
    })
    .to_string()
}

fn jsonrpc_notification(method: &str, params: serde_json::Value) -> String {
    serde_json::json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
    })
    .to_string()
}

fn extract_result(response: &str) -> Result<serde_json::Value, String> {
    let parsed: serde_json::Value =
        serde_json::from_str(response).map_err(|e| format!("Invalid JSON response: {}", e))?;

    if let Some(error) = parsed.get("error") {
        return Err(format!("Server error: {}", error));
    }

    parsed
        .get("result")
        .cloned()
        .ok_or_else(|| "Missing 'result' in JSON-RPC response".to_string())
}

// ── Stdio introspection ─────────────────────────────────────────────

fn introspect_stdio(
    command: &str,
    args: &[String],
    env: &HashMap<String, String>,
) -> Result<IntrospectionResult, String> {
    let mut child = Command::new(command)
        .args(args)
        .envs(env)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn '{}': {}", command, e))?;

    let stdin = child.stdin.as_mut().ok_or("Cannot open stdin")?;
    let stdout = child.stdout.take().ok_or("Cannot open stdout")?;
    let mut reader = BufReader::new(stdout);

    // Helper: send a JSON-RPC message and read one line response
    let send_and_read = |stdin: &mut dyn Write, reader: &mut BufReader<_>, msg: &str| -> Result<String, String> {
        let payload = format!("{}\n", msg);
        stdin
            .write_all(payload.as_bytes())
            .map_err(|e| format!("Write failed: {}", e))?;
        stdin.flush().map_err(|e| format!("Flush failed: {}", e))?;

        let mut line = String::new();
        reader
            .read_line(&mut line)
            .map_err(|e| format!("Read failed: {}", e))?;
        Ok(line.trim().to_string())
    };

    // 1. Initialize
    let init_req = jsonrpc_request(
        1,
        "initialize",
        serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": { "name": "vinkius-desktop", "version": "1.0" }
        }),
    );

    let init_response = send_and_read(stdin, &mut reader, &init_req)?;
    let init_result = extract_result(&init_response)?;

    let server_info = init_result.get("serverInfo").map(|info| ServerInfo {
        name: info.get("name").and_then(|v| v.as_str()).map(String::from),
        version: info.get("version").and_then(|v| v.as_str()).map(String::from),
    });

    // Send initialized notification
    let initialized_notif = jsonrpc_notification("notifications/initialized", serde_json::json!({}));
    let notif_payload = format!("{}\n", initialized_notif);
    stdin
        .write_all(notif_payload.as_bytes())
        .map_err(|e| format!("Write failed: {}", e))?;
    stdin.flush().map_err(|_| "Flush failed".to_string())?;

    // 2. List tools
    let tools_req = jsonrpc_request(2, "tools/list", serde_json::json!({}));
    let tools: Vec<McpTool> = match send_and_read(stdin, &mut reader, &tools_req) {
        Ok(resp) => extract_result(&resp)
            .ok()
            .and_then(|r| r.get("tools").cloned())
            .and_then(|t| serde_json::from_value(t).ok())
            .unwrap_or_default(),
        Err(_) => vec![],
    };

    // 3. List resources
    let res_req = jsonrpc_request(3, "resources/list", serde_json::json!({}));
    let resources: Vec<McpResource> = match send_and_read(stdin, &mut reader, &res_req) {
        Ok(resp) => extract_result(&resp)
            .ok()
            .and_then(|r| r.get("resources").cloned())
            .and_then(|t| serde_json::from_value(t).ok())
            .unwrap_or_default(),
        Err(_) => vec![],
    };

    // 4. List prompts
    let prompts_req = jsonrpc_request(4, "prompts/list", serde_json::json!({}));
    let prompts: Vec<McpPrompt> = match send_and_read(stdin, &mut reader, &prompts_req) {
        Ok(resp) => extract_result(&resp)
            .ok()
            .and_then(|r| r.get("prompts").cloned())
            .and_then(|t| serde_json::from_value(t).ok())
            .unwrap_or_default(),
        Err(_) => vec![],
    };

    // Kill the child process
    let _ = child.kill();
    let _ = child.wait();

    Ok(IntrospectionResult {
        tools,
        resources,
        prompts,
        server_info,
    })
}

// ── HTTP introspection (Streamable HTTP → SSE fallback) ─────────────

async fn introspect_http(url: &str) -> Result<IntrospectionResult, String> {
    // Try Streamable HTTP first (direct JSON-RPC POST)
    match introspect_streamable_http(url).await {
        Ok(result) => return Ok(result),
        Err(streamable_err) => {
            log::info!("Streamable HTTP failed ({}), trying SSE fallback...", streamable_err);
        }
    }

    // Fallback: SSE transport
    introspect_sse(url).await
}

/// Streamable HTTP: POST JSON-RPC directly to the URL
async fn introspect_streamable_http(url: &str) -> Result<IntrospectionResult, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let send = |client: &reqwest::Client, url: &str, body: String| {
        let client = client.clone();
        let url = url.to_string();
        async move {
            let resp = client
                .post(&url)
                .header("Content-Type", "application/json")
                .body(body)
                .send()
                .await
                .map_err(|e| format!("HTTP request failed: {}", e))?;

            let content_type = resp
                .headers()
                .get("content-type")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("")
                .to_string();

            // If server returns text/event-stream, this is SSE, not Streamable HTTP
            if content_type.contains("text/event-stream") {
                return Err("Server responded with SSE, not Streamable HTTP".to_string());
            }

            resp.text()
                .await
                .map_err(|e| format!("HTTP read failed: {}", e))
        }
    };

    // 1. Initialize
    let init_req = jsonrpc_request(
        1,
        "initialize",
        serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": { "name": "vinkius-desktop", "version": "1.0" }
        }),
    );

    let init_response = send(&client, url, init_req).await?;
    let init_result = extract_result(&init_response)?;

    let server_info = init_result.get("serverInfo").map(|info| ServerInfo {
        name: info.get("name").and_then(|v| v.as_str()).map(String::from),
        version: info.get("version").and_then(|v| v.as_str()).map(String::from),
    });

    // Send initialized notification
    let _ = send(
        &client,
        url,
        jsonrpc_notification("notifications/initialized", serde_json::json!({})),
    )
    .await;

    // 2-4. List tools, resources, prompts
    let tools = list_via_post(&client, url, 2, "tools/list", "tools").await;
    let resources = list_via_post(&client, url, 3, "resources/list", "resources").await;
    let prompts = list_via_post(&client, url, 4, "prompts/list", "prompts").await;

    Ok(IntrospectionResult {
        tools: serde_json::from_value(tools).unwrap_or_default(),
        resources: serde_json::from_value(resources).unwrap_or_default(),
        prompts: serde_json::from_value(prompts).unwrap_or_default(),
        server_info,
    })
}

/// SSE transport: GET the endpoint for SSE stream, extract message URL, POST JSON-RPC there
async fn introspect_sse(url: &str) -> Result<IntrospectionResult, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    // 1. Connect to SSE endpoint to discover the message URL
    let sse_response = client
        .get(url)
        .header("Accept", "text/event-stream")
        .send()
        .await
        .map_err(|e| format!("SSE connection failed: {}", e))?;

    let sse_body = sse_response
        .text()
        .await
        .map_err(|e| format!("SSE read failed: {}", e))?;

    // Parse the endpoint event from the SSE stream
    // Format: "event: endpoint\ndata: /message?sessionId=xxx\n\n"
    let message_path = sse_body
        .lines()
        .skip_while(|line| !line.starts_with("event: endpoint"))
        .nth(1) // next line after "event: endpoint" is "data: ..."
        .and_then(|line| line.strip_prefix("data: "))
        .map(|path| path.trim().to_string());

    let message_url = match message_path {
        Some(path) => {
            // Resolve relative path against the base URL
            if path.starts_with("http") {
                path
            } else {
                let base = url::Url::parse(url)
                    .map_err(|e| format!("Invalid URL: {}", e))?;
                base.join(&path)
                    .map_err(|e| format!("URL join failed: {}", e))?
                    .to_string()
            }
        }
        None => {
            // Some SSE servers expect POST on the same URL
            url.to_string()
        }
    };

    // 2. Initialize via POST to the message URL
    let init_req = jsonrpc_request(
        1,
        "initialize",
        serde_json::json!({
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": { "name": "vinkius-desktop", "version": "1.0" }
        }),
    );

    let init_response = client
        .post(&message_url)
        .header("Content-Type", "application/json")
        .body(init_req)
        .send()
        .await
        .map_err(|e| format!("SSE POST failed: {}", e))?
        .text()
        .await
        .map_err(|e| format!("SSE read failed: {}", e))?;

    // SSE responses may be wrapped in SSE event format
    let init_json = extract_json_from_sse_or_raw(&init_response);
    let init_result = extract_result(&init_json)?;

    let server_info = init_result.get("serverInfo").map(|info| ServerInfo {
        name: info.get("name").and_then(|v| v.as_str()).map(String::from),
        version: info.get("version").and_then(|v| v.as_str()).map(String::from),
    });

    // Send initialized notification
    let _ = client
        .post(&message_url)
        .header("Content-Type", "application/json")
        .body(jsonrpc_notification("notifications/initialized", serde_json::json!({})))
        .send()
        .await;

    // 3-5. List tools, resources, prompts
    let tools = list_via_sse_post(&client, &message_url, 2, "tools/list", "tools").await;
    let resources = list_via_sse_post(&client, &message_url, 3, "resources/list", "resources").await;
    let prompts = list_via_sse_post(&client, &message_url, 4, "prompts/list", "prompts").await;

    Ok(IntrospectionResult {
        tools: serde_json::from_value(tools).unwrap_or_default(),
        resources: serde_json::from_value(resources).unwrap_or_default(),
        prompts: serde_json::from_value(prompts).unwrap_or_default(),
        server_info,
    })
}

/// Helper: POST a JSON-RPC list request and extract the keyed array from response
async fn list_via_post(
    client: &reqwest::Client,
    url: &str,
    id: u64,
    method: &str,
    key: &str,
) -> serde_json::Value {
    let resp = client
        .post(url)
        .header("Content-Type", "application/json")
        .body(jsonrpc_request(id, method, serde_json::json!({})))
        .send()
        .await
        .ok()
        .and_then(|r| futures::executor::block_on(r.text()).ok());

    resp.and_then(|r| extract_result(&r).ok())
        .and_then(|r| r.get(key).cloned())
        .unwrap_or(serde_json::json!([]))
}

/// Helper: POST JSON-RPC to SSE message endpoint, handle SSE-wrapped responses
async fn list_via_sse_post(
    client: &reqwest::Client,
    url: &str,
    id: u64,
    method: &str,
    key: &str,
) -> serde_json::Value {
    let resp = client
        .post(url)
        .header("Content-Type", "application/json")
        .body(jsonrpc_request(id, method, serde_json::json!({})))
        .send()
        .await
        .ok()
        .and_then(|r| futures::executor::block_on(r.text()).ok());

    resp.map(|r| extract_json_from_sse_or_raw(&r))
        .and_then(|r| extract_result(&r).ok())
        .and_then(|r| r.get(key).cloned())
        .unwrap_or(serde_json::json!([]))
}

/// Extract JSON from raw text or SSE-formatted event data
fn extract_json_from_sse_or_raw(text: &str) -> String {
    let trimmed = text.trim();

    // If it starts with '{', it's already raw JSON
    if trimmed.starts_with('{') {
        return trimmed.to_string();
    }

    // Try to extract "data: {...}" from SSE format
    for line in trimmed.lines() {
        let line = line.trim();
        if let Some(data) = line.strip_prefix("data: ") {
            let data = data.trim();
            if data.starts_with('{') {
                return data.to_string();
            }
        }
    }

    // Return as-is, will fail at JSON parse
    trimmed.to_string()
}

// ── Tauri command ───────────────────────────────────────────────────

#[tauri::command]
pub async fn introspect_server(
    transport: String,
    command: String,
    args: Vec<String>,
    url: String,
    env: HashMap<String, String>,
) -> Result<IntrospectionResult, String> {
    if transport == "http" {
        if url.is_empty() {
            return Err("URL is required for HTTP introspection".to_string());
        }
        introspect_http(&url).await
    } else {
        if command.is_empty() {
            return Err("Command is required for stdio introspection".to_string());
        }
        // Run stdio in a blocking thread to avoid blocking the async runtime
        let command = command.clone();
        let args = args.clone();
        let env = env.clone();
        tokio::task::spawn_blocking(move || introspect_stdio(&command, &args, &env))
            .await
            .map_err(|e| format!("Introspection task failed: {}", e))?
    }
}
