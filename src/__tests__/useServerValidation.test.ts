import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useServerValidation } from '@/composables/useServerValidation'

describe('useServerValidation Composable', () => {
  it('allows safe characters and basic names', () => {
    const serverName = ref('my-valid_name.123@vinkius/namespace')
    const transport = ref<'stdio' | 'http'>('stdio')
    const command = ref('npx')
    const url = ref('')
    const selectedClients = ref(['vscode'])

    const { nameError, isValid } = useServerValidation(serverName, transport, command, url, selectedClients)
    expect(nameError.value).toBeNull()
    expect(isValid.value).toBe(true)
  })

  it('allows complex characters and spaces but rejects quotes', () => {
    // Valid
    const validState = useServerValidation(ref('fale como pirata !'), ref('stdio'), ref('npx'), ref(''), ref(['vscode']))
    expect(validState.nameError.value).toBeNull()
    expect(validState.isValid.value).toBe(true)

    // Invalid (Quotes)
    const invalidState = useServerValidation(ref('fale "como" pirata'), ref('stdio'), ref('npx'), ref(''), ref(['vscode']))
    expect(invalidState.nameError.value).toContain('Cannot contain quotes')
    expect(invalidState.isValid.value).toBe(false)
  })

  it('rejects completely empty string or whitespace names', () => {
    const serverName = ref('    ')
    const transport = ref<'stdio' | 'http'>('stdio')
    const command = ref('npx')
    const url = ref('')
    const selectedClients = ref(['vscode'])

    const { nameError, isValid } = useServerValidation(serverName, transport, command, url, selectedClients)
    expect(nameError.value).toContain('Server name is required')
    expect(isValid.value).toBe(false)
  })

  it('validates stdio transport requires a command', () => {
    const serverName = ref('valid-server')
    const transport = ref<'stdio' | 'http'>('stdio')
    const command = ref(' ') // Empty or whitespace command
    const url = ref('')
    const selectedClients = ref(['vscode'])

    const { transportError, isValid } = useServerValidation(serverName, transport, command, url, selectedClients)
    expect(transportError.value).toContain('Execution command is required')
    expect(isValid.value).toBe(false)
  })

  it('validates http transport requires a valid url', () => {
    const serverName = ref('valid-server')
    const transport = ref<'stdio' | 'http'>('http')
    const command = ref('')
    const url = ref('localhost:8080') // Missing http://
    const selectedClients = ref(['vscode'])

    let validation = useServerValidation(serverName, transport, command, url, selectedClients)
    expect(validation.transportError.value).toContain('valid HTTP URL')
    expect(validation.isValid.value).toBe(false)

    // Valid case
    url.value = 'http://localhost:8080'
    const newValidation = useServerValidation(serverName, transport, command, url, selectedClients)
    expect(newValidation.transportError.value).toBeNull()
    expect(newValidation.isValid.value).toBe(true)
  })

  it('requires at least one selected client', () => {
    const serverName = ref('valid-server')
    const transport = ref<'stdio' | 'http'>('stdio')
    const command = ref('npx')
    const url = ref('')
    const selectedClients = ref<string[]>([]) // Empty clients

    const { clientsError, isValid } = useServerValidation(serverName, transport, command, url, selectedClients)
    expect(clientsError.value).toContain('Select at least one destination')
    expect(isValid.value).toBe(false)
  })
})
