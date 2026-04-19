<script setup lang="ts">
import { ref, watch } from 'vue'
import { useClientsStore } from '@/stores/clients'
import { storeToRefs } from 'pinia'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Terminal, Globe, Plus, Trash2 } from 'lucide-vue-next'
import { useServerValidation } from '@/composables/useServerValidation'
import { getClientMeta, getClientInitial } from '@/composables/useClientMeta'
import type { ServerConfig } from '@/types'

interface InitialData {
  name: string
  transport: string
  command: string
  args: string[]
  url: string
  env: Record<string, string>
  installedIn: string[]
}

const props = defineProps<{
  initialData?: InitialData
}>()

const clientsStore = useClientsStore()
const { clients } = storeToRefs(clientsStore)

// Form state
const serverName = ref('')
const transport = ref<'stdio' | 'http'>('stdio')
const command = ref('')
const args = ref('')
const url = ref('')
const envVars = ref<Array<{ key: string; value: string }>>([])
const selectedClients = ref<string[]>([])

// Dirty tracking — only show errors after user interaction
const nameTouched = ref(false)

const { nameError, isValid } = useServerValidation(
  serverName,
  transport,
  command,
  url,
  selectedClients
)

// Mark touched on first input
watch(serverName, () => { nameTouched.value = true })

// Seed from initial data when available (edit mode)
watch(() => props.initialData, (data) => {
  if (data) {
    serverName.value = data.name
    transport.value = data.transport as 'stdio' | 'http'
    command.value = data.command || ''
    args.value = data.args?.length ? data.args.join(' ') : ''
    url.value = data.url || ''
    envVars.value = Object.entries(data.env || {}).map(([k, v]) => ({ key: k, value: v }))
    selectedClients.value = [...data.installedIn]
    nameTouched.value = false
  }
}, { immediate: true })

function toggleClient(clientId: string) {
  const idx = selectedClients.value.indexOf(clientId)
  if (idx >= 0) {
    selectedClients.value.splice(idx, 1)
  } else {
    selectedClients.value.push(clientId)
  }
}

function addEnvVar() {
  envVars.value.push({ key: '', value: '' })
}

function removeEnvVar(index: number) {
  envVars.value.splice(index, 1)
}

function getServerConfig(): ServerConfig {
  return {
    name: serverName.value.trim(),
    transport: transport.value,
    command: transport.value === 'stdio' ? command.value.trim() : '',
    args: transport.value === 'stdio' ? args.value.trim().split(/\s+/).filter(Boolean) : [],
    url: transport.value === 'http' ? url.value.trim() : '',
    env: Object.fromEntries(
      envVars.value
        .filter((v) => v.key.trim())
        .map((v) => [v.key.trim(), v.value])
    ),
  }
}

defineExpose({
  serverName,
  selectedClients,
  isValid,
  getServerConfig,
})
</script>

<template>
  <div class="space-y-0">

    <!-- Server Name -->
    <div class="pb-4">
      <Input
        id="server-name"
        v-model="serverName"
        placeholder="Server name"
        class="h-10 bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/35"
      />
      <p v-if="nameTouched && nameError" class="text-xs text-destructive mt-1">
        {{ nameError }}
      </p>
    </div>

    <!-- CONNECTION — section label row + transport tabs + fields -->
    <div class="py-3">
      <div class="flex items-baseline justify-between mb-2.5">
        <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Connection</Label>
        <span class="text-muted-foreground/50 text-xs">How the server communicates with your AI clients.</span>
      </div>

      <Tabs v-model="transport" class="w-full">
        <TabsList class="grid w-full grid-cols-2 h-9 bg-muted/60 border border-border p-0.5 rounded-lg">
          <TabsTrigger value="stdio" class="h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-xs transition-all">
            <span class="flex items-center gap-1.5">
              <Terminal class="w-3.5 h-3.5" />
              Stdio
            </span>
          </TabsTrigger>
          <TabsTrigger value="http" class="h-full rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground text-xs transition-all">
            <span class="flex items-center gap-1.5">
              <Globe class="w-3.5 h-3.5" />
              Streamable HTTP
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stdio" class="mt-2.5 animate-in fade-in duration-150">
          <!-- Two fields side-by-side on wider viewports, stacked on narrow -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input id="command" v-model="command" placeholder="Command (e.g. npx, python, docker)" class="h-9 bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-ring text-sm font-mono placeholder:text-muted-foreground/35" />
            <Input id="args" v-model="args" placeholder="Arguments (e.g. -y @modelcontextprotocol/server-everything)" class="h-9 bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-ring text-sm font-mono placeholder:text-muted-foreground/35" />
          </div>
        </TabsContent>

        <TabsContent value="http" class="mt-2.5 animate-in fade-in duration-150">
          <Input id="url" v-model="url" placeholder="URL (e.g. https://edge.vinkius.com/[TOKEN]/mcp)" class="h-9 bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-ring text-sm font-mono placeholder:text-muted-foreground/35" />
        </TabsContent>
      </Tabs>
    </div>

    <div class="h-px bg-border" />

    <!-- ENVIRONMENT VARIABLES — inline, collapsed by default -->
    <div class="py-3">
      <div class="flex items-center justify-between">
        <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Environment Variables</Label>
        <Button variant="ghost" size="sm" class="h-6 text-xs text-muted-foreground hover:bg-accent hover:text-foreground px-1.5 gap-1" @click="addEnvVar">
          <Plus class="h-3 w-3" />
          Add
        </Button>
      </div>

      <div class="space-y-1.5 mt-2" v-if="envVars.length > 0">
        <div
          v-for="(envVar, index) in envVars"
          :key="index"
          class="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <Input
            v-model="envVar.key"
            placeholder="VARIABLE_NAME"
            class="flex-1 font-mono text-sm h-8 bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Input
            v-model="envVar.value"
            placeholder="Unset"
            type="password"
            class="flex-1 font-mono text-sm h-8 bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/30"
          />
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            @click="removeEnvVar(index)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <div class="h-px bg-border" />

    <!-- DESTINATIONS — compact client grid -->
    <div class="py-3">
      <div class="flex items-baseline justify-between mb-2.5">
        <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Destinations</Label>
        <span class="text-muted-foreground/50 text-xs">Select which AI clients should receive this MCP server configuration.</span>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="client in clients"
          :key="client.id"
          type="button"
          class="relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all select-none text-left"
          :class="[
            !client.detected ? 'opacity-30 border-border/50 bg-muted/20 cursor-not-allowed pointer-events-none grayscale' : 'cursor-pointer group',
            client.detected && selectedClients.includes(client.id) ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : '',
            client.detected && !selectedClients.includes(client.id) ? 'bg-transparent border-border hover:bg-muted/40 hover:border-border' : ''
          ]"
          @click="client.detected && toggleClient(client.id)"
        >
          <!-- Client logo -->
          <div
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md overflow-hidden"
            :style="{ backgroundColor: getClientMeta(client.id).color + '14' }"
          >
            <img
              v-if="getClientMeta(client.id).logo"
              :src="getClientMeta(client.id).logo"
              :alt="client.name"
              class="h-3.5 w-3.5 object-contain"
              @error="($event.target as HTMLImageElement).style.display = 'none'; ($event.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')"
            />
            <span class="hidden text-[9px] font-bold" :style="{ color: getClientMeta(client.id).color }">{{ getClientInitial(client.name) }}</span>
          </div>

          <!-- Name -->
          <span class="flex-1 font-medium text-xs transition-colors truncate" :class="selectedClients.includes(client.id) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'">
            {{ client.name }}
          </span>

          <!-- Selection indicator -->
          <div v-if="client.detected" class="w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0"
            :class="selectedClients.includes(client.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border bg-background group-hover:border-muted-foreground'">
            <CheckCircle2 v-if="selectedClients.includes(client.id)" class="w-2.5 h-2.5" />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
