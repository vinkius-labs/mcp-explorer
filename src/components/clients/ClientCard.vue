<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { DiscoveredClient } from '@/types'
import { CheckCircle2, Circle } from 'lucide-vue-next'

defineProps<{
  client: DiscoveredClient
}>()

const router = useRouter()

/** Get a deterministic icon color from client name */
function clientAccent(name: string): string {
  const accents = [
    'from-violet-600 to-purple-800',
    'from-blue-600 to-indigo-800',
    'from-emerald-600 to-teal-800',
    'from-orange-500 to-rose-700',
    'from-cyan-500 to-blue-700',
    'from-pink-500 to-fuchsia-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return accents[Math.abs(hash) % accents.length]
}
</script>

<template>
  <div
    class="group flex flex-col gap-3 rounded-lg bg-surface-hover p-3 transition-colors duration-200 cursor-pointer hover:bg-surface-active"
    @click="router.push(`/clients/${client.id}`)"
  >
    <!-- Icon -->
    <div
      class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white text-lg font-bold shadow-lg"
      :class="clientAccent(client.name)"
    >
      {{ client.name.charAt(0) }}
    </div>

    <!-- Info -->
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-foreground">
        {{ client.name }}
      </p>
      <p class="text-xs text-muted-foreground mt-0.5">
        <template v-if="client.detected">
          <span class="inline-flex items-center gap-1">
            <CheckCircle2 class="h-3 w-3 text-white" />
            {{ client.servers.length }} server{{ client.servers.length !== 1 ? 's' : '' }}
          </span>
          <span v-if="client.version" class="ml-1.5 text-muted-foreground/60">
            v{{ client.version }}
          </span>
        </template>
        <template v-else>
          <span class="inline-flex items-center gap-1 text-muted-foreground/60">
            <Circle class="h-3 w-3" />
            Not installed
          </span>
        </template>
      </p>
    </div>
  </div>
</template>
