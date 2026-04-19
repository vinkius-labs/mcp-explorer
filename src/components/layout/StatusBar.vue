<script setup lang="ts">
import { useClientsStore } from '@/stores/clients'
import { useServersStore } from '@/stores/servers'
import { storeToRefs } from 'pinia'
import { CheckCircle2, AlertCircle } from 'lucide-vue-next'

const clientsStore = useClientsStore()
const serversStore = useServersStore()
const { detectedClients, allHealthy } = storeToRefs(clientsStore)
const { servers } = storeToRefs(serversStore)
</script>

<template>
  <footer
    class="flex h-6 shrink-0 items-center justify-between border-t border-border bg-background/50 px-3 text-[11px] text-muted-foreground"
  >
    <div class="flex items-center gap-3">
      <span>{{ detectedClients.length }} discovered</span>
      <span>·</span>
      <span>{{ servers.length }} server{{ servers.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="flex items-center gap-1.5">
      <template v-if="allHealthy">
        <CheckCircle2 class="h-3 w-3 text-foreground" />
        <span class="text-foreground">All configs healthy</span>
      </template>
      <template v-else>
        <AlertCircle class="h-3 w-3 text-amber-500" />
        <span class="text-amber-500">Config issues found</span>
      </template>
    </div>
  </footer>
</template>
