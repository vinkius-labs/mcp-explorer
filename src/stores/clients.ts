import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tauriInvoke, tauriListen } from '@/composables/useTauri'
import type { DiscoveredClient } from '@/types'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref<DiscoveredClient[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const detectedClients = computed(() =>
    clients.value.filter((c) => c.detected)
  )

  const totalServers = computed(() =>
    detectedClients.value.reduce((sum, c) => sum + c.servers.length, 0)
  )

  const allHealthy = computed(() =>
    detectedClients.value.every((c) => c.detected)
  )

  async function discover() {
    loading.value = true
    error.value = null
    try {
      clients.value = await tauriInvoke<DiscoveredClient[]>('discover_clients')
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  function getClient(id: string): DiscoveredClient | undefined {
    return clients.value.find((c) => c.id === id)
  }

  function setupListeners() {
    tauriListen('config-changed', () => {
      // Re-discover when an external change is discovered
      discover()
    })
  }

  return {
    clients,
    loading,
    error,
    detectedClients,
    totalServers,
    allHealthy,
    discover,
    getClient,
    setupListeners,
  }
})
