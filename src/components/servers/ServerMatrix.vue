<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useServersStore } from '@/stores/servers'
import { useClientsStore } from '@/stores/clients'
import { storeToRefs } from 'pinia'
import { Server, Globe, Terminal, ChevronRight } from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ServerEntry } from '@/types'

/**
 * Unified server list table used by both:
 * - ServersView (global "Installed MCP Servers" — shows Clients column)
 * - ClientDetailView (scoped to one AI client — hides Clients column)
 *
 * Props:
 * - servers: Optional override. If provided, uses these instead of the global store.
 * - clientId: If provided, enables per-client removal and hides the Clients column.
 * - search: v-model for search/filter (only applies to global mode).
 */

const props = withDefaults(defineProps<{
  servers?: ServerEntry[]
  clientId?: string
}>(), {
  servers: undefined,
  clientId: undefined,
})

const search = defineModel<string>('search', { default: '' })



const router = useRouter()
const serversStore = useServersStore()
const clientsStore = useClientsStore()
const { servers: globalServers } = storeToRefs(serversStore)
const { clients } = storeToRefs(clientsStore)

const isGlobal = computed(() => !props.clientId)

/** Normalize both data shapes into a common row type */
interface ServerRow {
  name: string
  transport: string
  command: string
  args: string[]
  url: string
  installedIn: string[]
}

const rows = computed<ServerRow[]>(() => {
  if (props.servers) {
    // Scoped mode — ServerEntry[] from a single client
    return [...props.servers]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => ({
        name: s.name,
        transport: s.transport,
        command: s.command,
        args: s.args,
        url: s.url,
        installedIn: props.clientId ? [props.clientId] : [],
      }))
  }
  // Global mode — AggregatedServer[] from store
  const q = (search.value || '').toLowerCase().trim()
  const list = [...globalServers.value].sort((a, b) => a.name.localeCompare(b.name))
  if (!q) return list
  return list.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.command.toLowerCase().includes(q) ||
    s.url.toLowerCase().includes(q),
  )
})

function clientName(id: string): string {
  return clients.value.find(c => c.id === id)?.name || id
}
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="rows.length === 0 && !search"
    class="flex flex-col items-center justify-center gap-3 rounded-xl bg-white/[0.02] py-16 text-center"
  >
    <Server class="h-8 w-8 text-muted-foreground/40" />
    <div>
      <p class="text-sm font-medium text-foreground">No MCP servers configured</p>
      <p class="text-sm text-muted-foreground mt-1">Add your first MCP server or install one from the registry.</p>
    </div>
  </div>

  <div v-else class="flex flex-col gap-3">
    <!-- No results -->
    <p v-if="rows.length === 0" class="text-sm text-muted-foreground py-8 text-center">
      No servers matching "{{ search }}"
    </p>

    <!-- Table -->
    <Table v-else>
      <TableHeader class="sticky top-0 z-10 bg-background/95 backdrop-blur-md">
        <TableRow class="border-b border-white/[0.06] hover:bg-transparent">
          <TableHead class="text-muted-foreground text-xs font-semibold uppercase tracking-wider pl-2">
            Server
          </TableHead>
          <TableHead class="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Transport
          </TableHead>
          <TableHead v-if="isGlobal" class="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Clients
          </TableHead>
          <TableHead class="w-8" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="server in rows"
          :key="server.name"
          class="border-b border-border cursor-pointer transition-all duration-150 hover:bg-accent group"
          @click="router.push(`/servers/${server.name}`)"
        >
          <!-- Name + command/url -->
          <TableCell class="py-3 pl-2">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-sm font-semibold text-foreground truncate transition-colors">{{ server.name }}</span>
              <span class="text-xs text-muted-foreground/70 truncate font-mono max-w-[300px]">
                {{ server.transport === 'http' ? server.url : [server.command, ...server.args].join(' ') }}
              </span>
            </div>
          </TableCell>

          <!-- Transport -->
          <TableCell class="py-3">
            <span
              class="inline-flex items-center gap-1.5 text-xs font-medium"
              :class="server.transport === 'http' ? 'text-blue-400' : 'text-amber-400'"
            >
              <Globe v-if="server.transport === 'http'" class="w-3 h-3" />
              <Terminal v-else class="w-3 h-3" />
              {{ server.transport === 'http' ? 'HTTP' : 'stdio' }}
            </span>
          </TableCell>

          <!-- Client pills (global mode only, max 3 + overflow) -->
          <TableCell v-if="isGlobal" class="py-3">
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="cid in server.installedIn.slice(0, 3)"
                :key="cid"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-muted-foreground/80"
              >
                {{ clientName(cid) }}
              </span>
              <span
                v-if="server.installedIn.length > 3"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] text-muted-foreground/50"
              >
                +{{ server.installedIn.length - 3 }}
              </span>
            </div>
          </TableCell>

          <!-- Chevron -->
          <TableCell class="py-3 pr-2 text-right">
            <ChevronRight class="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all duration-150 inline-block" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
