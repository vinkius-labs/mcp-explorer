import { ref } from 'vue'
import { tauriInvoke } from '@/composables/useTauri'

export interface McpTool {
  name: string
  description: string | null
  inputSchema: Record<string, unknown> | null
}

export interface McpResource {
  uri: string
  name: string | null
  description: string | null
  mimeType: string | null
}

export interface McpPrompt {
  name: string
  description: string | null
  arguments: Array<{ name: string; description: string | null; required: boolean | null }> | null
}

export interface ServerInfo {
  name: string | null
  version: string | null
}

export interface IntrospectionResult {
  tools: McpTool[]
  resources: McpResource[]
  prompts: McpPrompt[]
  server_info: ServerInfo | null
}

/**
 * Composable for MCP server introspection.
 * Connects to a server via JSON-RPC 2.0 and discovers its capabilities
 * (tools, resources, prompts) for both stdio and HTTP transports.
 */
export function useMcpIntrospection() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<IntrospectionResult | null>(null)

  async function introspect(config: {
    transport: string
    command: string
    args: string[]
    url: string
    env: Record<string, string>
  }): Promise<void> {
    loading.value = true
    error.value = null
    result.value = null

    try {
      result.value = await tauriInvoke<IntrospectionResult>('introspect_server', {
        transport: config.transport,
        command: config.command,
        args: config.args,
        url: config.url,
        env: config.env,
      })
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    loading.value = false
    error.value = null
    result.value = null
  }

  return { loading, error, result, introspect, reset }
}
