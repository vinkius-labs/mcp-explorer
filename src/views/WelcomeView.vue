<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiscovery } from '@/composables/useDiscovery'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Loader2, Search } from 'lucide-vue-next'

const router = useRouter()
const { detectedClients, clients, loading } = useDiscovery()
const scanning = ref(true)

onMounted(() => {
  // Simulate scanning animation
  setTimeout(() => {
    scanning.value = false
  }, 2000)
})

function getStarted() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-8 p-8">
    <!-- Logo + Title -->
    <div class="flex flex-col items-center gap-3">
      <img src="/vinkius.svg" alt="Vinkius" class="h-12 w-12" />
      <h1 class="text-2xl font-semibold tracking-tight">Welcome to Vinkius Desktop</h1>
    </div>

    <!-- Scanning state -->
    <div class="flex flex-col items-center gap-4 w-full max-w-sm">
      <div
        class="flex items-center gap-2 text-sm text-muted-foreground"
        v-if="scanning || loading"
      >
        <Loader2 class="h-4 w-4 animate-spin" />
        <span>Discovering your MCP clients...</span>
      </div>

      <div
        class="flex items-center gap-2 text-sm text-muted-foreground"
        v-else
      >
        <Search class="h-4 w-4" />
        <span>Discovery complete</span>
      </div>

      <!-- Client list -->
      <div
        class="w-full rounded-xl border border-border bg-card p-4 space-y-3"
        v-if="!scanning"
      >
        <div
          v-for="client in clients"
          :key="client.id"
          class="flex items-center justify-between text-sm"
        >
          <div class="flex items-center gap-2">
            <CheckCircle2
              v-if="client.detected"
              class="h-4 w-4 text-white"
            />
            <Circle v-else class="h-4 w-4 text-muted-foreground/40" />
            <span :class="client.detected ? 'text-foreground' : 'text-muted-foreground'">
              {{ client.name }}
            </span>
          </div>
          <span class="text-muted-foreground text-xs">
            {{ client.detected ? `${client.servers.length} servers` : 'not installed' }}
          </span>
        </div>
      </div>

      <!-- Summary -->
      <p v-if="!scanning" class="text-sm text-muted-foreground text-center">
        {{ detectedClients.length }} client{{ detectedClients.length !== 1 ? 's' : '' }} discovered on your machine.
      </p>
    </div>

    <!-- CTA -->
    <Button
      size="lg"
      class="gap-2"
      :disabled="scanning || loading"
      @click="getStarted"
    >
      Get Started
      <span class="text-lg">→</span>
    </Button>
  </div>
</template>
