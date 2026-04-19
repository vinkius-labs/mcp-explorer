<script setup lang="ts">
import { ref } from 'vue'
import { useServersStore, type AggregatedServer } from '@/stores/servers'
import { CheckCircle2, Plus, Loader2 } from 'lucide-vue-next'
import type { ServerConfig } from '@/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const props = defineProps<{
  server: AggregatedServer
  clientId: string
  installed: boolean
}>()

const serversStore = useServersStore()
const loading = ref(false)

async function handleClick() {
  loading.value = true
  try {
    if (props.installed) {
      await serversStore.removeServer(props.server.name, [props.clientId])
    } else {
      const serverConfig: ServerConfig = {
        name: props.server.name,
        transport: props.server.transport,
        command: props.server.command,
        args: props.server.args,
        url: props.server.url,
        env: props.server.env,
      }
      await serversStore.installServer(serverConfig, [props.clientId])
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <TooltipProvider :delay-duration="400">
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          class="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors mx-auto"
          :class="
            installed
              ? 'text-white hover:text-destructive hover:bg-destructive/10'
              : 'text-muted-foreground/40 hover:text-primary hover:bg-primary/10'
          "
          :disabled="loading"
          @click="handleClick"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <CheckCircle2 v-else-if="installed" class="h-4 w-4" />
          <Plus v-else class="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {{ installed ? `Remove ${server.name}` : `Install ${server.name}` }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
