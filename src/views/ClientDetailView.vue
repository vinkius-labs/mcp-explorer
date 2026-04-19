<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import ServerMatrix from '@/components/servers/ServerMatrix.vue'
import {
  AlertTriangle, Plus,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const clientsStore = useClientsStore()

const clientId = computed(() => String(route.params.id))
const client = computed(() => clientsStore.getClient(clientId.value))
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- Header — compact, single line (same as ServerFormView) -->
    <div class="flex-none px-6 py-3 shrink-0 bg-background flex items-baseline justify-between gap-4">
      <h1 class="text-xl font-bold tracking-tight text-foreground leading-normal truncate">
        {{ client?.name ?? clientId }}
      </h1>
      <p class="text-muted-foreground text-sm shrink-0">
        {{ client?.detected ? `${client.servers.length} MCP server${client.servers.length !== 1 ? 's' : ''} configured` : 'Not detected on this machine' }}
      </p>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-2">

      <!-- Client not found -->
      <template v-if="!client">
        <div class="flex flex-col items-center justify-center py-24 gap-4 text-center text-muted-foreground">
          <p class="text-sm">Client not found.</p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-5 pb-8">

          <!-- Status -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Status</Label>
              <span class="inline-flex items-center gap-1.5 text-sm font-medium" :class="client.detected ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'">
                <div class="h-1.5 w-1.5 rounded-full" :class="client.detected ? 'bg-emerald-400' : 'bg-muted-foreground/30'" />
                {{ client.detected ? 'Installed' : 'Not detected' }}
              </span>
            </div>
          </div>

          <!-- Configuration -->
          <div class="space-y-1.5">
            <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Configuration</Label>
            <p v-if="client.config_path" class="text-sm font-mono text-foreground/80 break-all">
              {{ client.config_path }}
            </p>
            <p v-else class="text-sm text-muted-foreground">
              No configuration file found yet.
            </p>
            <div v-if="client.restart_required" class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle class="h-3.5 w-3.5" />
              <span class="text-xs">Requires restart after changes</span>
            </div>
          </div>

          <Separator class="bg-border" />

          <!-- MCP Servers (reusable ServerMatrix) -->
          <div class="space-y-1.5">
            <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              MCP Servers ({{ client.servers.length }})
            </Label>
            <ServerMatrix :servers="client.servers" :client-id="clientId" />
          </div>

        </div>
      </template>
    </div>

    <!-- Sticky Footer (same pattern as ServerFormView) -->
    <div v-if="client" class="flex-none px-6 py-3 bg-background/80 backdrop-blur-md border-t border-border flex items-center shrink-0">
      <div class="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" class="text-muted-foreground" @click="router.push('/clients')">
          Back to AI Clients
        </Button>
        <Button size="sm" class="gap-2" @click="router.push('/servers/add')">
          <Plus class="h-4 w-4" />
          Add MCP Server
        </Button>
      </div>
    </div>
  </div>
</template>
