import { onMounted } from 'vue'
import { useClientsStore } from '@/stores/clients'
import { storeToRefs } from 'pinia'

/**
 * Composable for client discovery logic.
 * Triggers discovery on mount and provides reactive state.
 */
export function useDiscovery() {
  const clientsStore = useClientsStore()
  const { clients, detectedClients, totalServers, allHealthy, loading, error } =
    storeToRefs(clientsStore)

  onMounted(async () => {
    if (clients.value.length === 0) {
      await clientsStore.discover()
    }
  })

  return {
    clients,
    detectedClients,
    totalServers,
    allHealthy,
    loading,
    error,
    refresh: clientsStore.discover,
  }
}
