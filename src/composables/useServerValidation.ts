import { computed, type Ref } from 'vue'

export function useServerValidation(
  serverName: Ref<string>,
  transport: Ref<'stdio' | 'http'>,
  command: Ref<string>,
  url: Ref<string>,
  selectedClients: Ref<string[]>
) {
  const nameError = computed(() => {
    if (!serverName.value || serverName.value.trim().length === 0) {
      return 'Server name is required.'
    }
    if (/["'`\\]/.test(serverName.value)) {
      return "Cannot contain quotes (' or \") or backslashes."
    }
    return null
  })

  const transportError = computed(() => {
    if (transport.value === 'stdio' && !command.value.trim()) {
      return 'Execution command is required.'
    }
    if (transport.value === 'http' && (!url.value.trim() || !url.value.startsWith('http'))) {
      return 'Please provide a valid HTTP URL.'
    }
    return null
  })

  const clientsError = computed(() => {
    if (selectedClients.value.length === 0) {
      return 'Select at least one destination.'
    }
    return null
  })

  const isValid = computed(() => {
    return !!serverName.value && !nameError.value && !transportError.value && !clientsError.value
  })

  return {
    nameError,
    transportError,
    clientsError,
    isValid
  }
}
