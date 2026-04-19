import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tauriInvoke } from '@/composables/useTauri'
import { useClientsStore } from './clients'
import type { ServerConfig, InstallResult, RemoveResult } from '@/types'

/**
 * Aggregated view of a server across all clients.
 * One entry per unique server name, tracking which clients have it installed.
 */
export interface AggregatedServer {
  name: string
  transport: string  // 'stdio' | 'http'
  command: string
  args: string[]
  url: string
  env: Record<string, string>
  installedIn: string[]  // client IDs
}

export const useServersStore = defineStore('servers', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Derives an aggregated server list from all discovered clients.
   * Each unique server name appears once, with the list of clients it's installed in.
   */
  const servers = computed<AggregatedServer[]>(() => {
    const clientsStore = useClientsStore()
    const map = new Map<string, AggregatedServer>()

    for (const client of clientsStore.detectedClients) {
      for (const server of client.servers) {
        const existing = map.get(server.name)
        if (existing) {
          existing.installedIn.push(client.id)
        } else {
          map.set(server.name, {
            name: server.name,
            transport: server.transport,
            command: server.command,
            args: [...server.args],
            url: server.url,
            env: { ...server.env },
            installedIn: [client.id],
          })
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  })

  async function installServer(
    server: ServerConfig,
    clientIds: string[]
  ): Promise<InstallResult[]> {
    loading.value = true
    error.value = null
    try {
      const results = await tauriInvoke<InstallResult[]>('install_server', {
        server,
        clientIds,
      })

      // Refresh client data after install
      const clientsStore = useClientsStore()
      await clientsStore.discover()

      return results
    } catch (e) {
      error.value = String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeServer(
    serverName: string,
    clientIds: string[]
  ): Promise<RemoveResult[]> {
    loading.value = true
    error.value = null
    try {
      const results = await tauriInvoke<RemoveResult[]>('remove_server', {
        serverName,
        clientIds,
      })

      // Refresh client data after removal
      const clientsStore = useClientsStore()
      await clientsStore.discover()

      return results
    } catch (e) {
      error.value = String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function syncServer(serverName: string) {
    loading.value = true
    error.value = null
    try {
      await tauriInvoke('sync_server', { serverName })
      const clientsStore = useClientsStore()
      await clientsStore.discover()
    } catch (e) {
      error.value = String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function getServer(name: string): AggregatedServer | undefined {
    return servers.value.find((s) => s.name === name)
  }

  return {
    servers,
    loading,
    error,
    installServer,
    removeServer,
    syncServer,
    getServer,
  }
})
