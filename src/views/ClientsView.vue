<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiscovery } from '@/composables/useDiscovery'
import { Radar, Zap, Shield } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { getClientMeta, getClientInitial } from '@/composables/useClientMeta'
import type { DiscoveredClient } from '@/types'

const ONBOARDING_KEY = 'vinkius:clients-onboarding-seen'

const router = useRouter()
const { clients, detectedClients: discoveredClients, loading } = useDiscovery()

const discovered = computed(() => clients.value.filter((c) => c.detected))
const notDiscovered = computed(() => clients.value.filter((c) => !c.detected))

// One-time onboarding modal
const showOnboarding = ref(false)

onMounted(() => {
  if (!localStorage.getItem(ONBOARDING_KEY)) {
    showOnboarding.value = true
  }
})

function dismissOnboarding() {
  showOnboarding.value = false
  localStorage.setItem(ONBOARDING_KEY, '1')
}

function getMeta(client: DiscoveredClient) {
  return getClientMeta(client.id)
}

function clientInitial(name: string) {
  return getClientInitial(name)
}
</script>

<template>
  <!-- Onboarding Modal (one-time) -->
  <Dialog :open="showOnboarding" @update:open="(v: boolean) => { if (!v) dismissOnboarding() }">
    <DialogContent class="sm:max-w-[480px] !bg-background border-border p-0 overflow-hidden gap-0" @interact-outside.prevent>

      <div class="relative px-8 pt-10 pb-8 flex flex-col gap-6">
        <!-- Ambient glow -->
        <div class="ob-reveal ob-d0 absolute top-0 left-0 w-40 h-40 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <!-- Icon + Title row -->
        <div class="ob-reveal ob-d1 flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Radar class="h-6 w-6 ob-scan" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-foreground">Auto-Discovery Engine</h2>
            <p class="text-xs text-muted-foreground/60 mt-0.5">Powered by filesystem probing</p>
          </div>
        </div>

        <!-- Description -->
        <p class="ob-reveal ob-d2 text-sm text-muted-foreground leading-relaxed">
          We scan your machine in real time and detect every AI client that supports MCP. No manual setup — everything is automatic.
        </p>

        <!-- Separator -->
        <div class="ob-reveal ob-d3 h-px bg-border" />

        <!-- Feature list -->
        <div class="flex flex-col gap-4">
          <div class="ob-reveal ob-d4 flex items-start gap-3">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground mt-0.5">
              <Zap class="h-3.5 w-3.5" />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">Instant Detection</p>
              <p class="text-xs text-muted-foreground mt-0.5">Claude, Cursor, VS Code, Windsurf, JetBrains, and 10+ more — discovered in milliseconds.</p>
            </div>
          </div>
          <div class="ob-reveal ob-d5 flex items-start gap-3">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground mt-0.5">
              <Shield class="h-3.5 w-3.5" />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">One-Click Sync</p>
              <p class="text-xs text-muted-foreground mt-0.5">Install any MCP server to all your AI clients simultaneously. Configuration files are managed for you.</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="ob-reveal ob-d6 pt-2">
          <Button size="lg" class="w-full h-11 text-sm font-semibold tracking-wide" @click="dismissOnboarding">
            Explore AI Clients
          </Button>
        </div>
      </div>

    </DialogContent>
  </Dialog>

  <div class="flex flex-col h-full overflow-hidden">

    <!-- Sticky header -->
    <div class="flex-none px-6 py-3 shrink-0 bg-background flex items-baseline justify-between gap-4">
      <h1 class="text-xl font-bold tracking-tight text-foreground leading-normal">
        AI Clients
      </h1>
      <p class="text-muted-foreground text-sm shrink-0">
        {{ discoveredClients.length }} of {{ clients.length }} discovered
      </p>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto">
      <div class="flex flex-col gap-6 p-6">

        <!-- Loading skeleton -->
        <div v-if="loading" class="flex flex-col gap-2">
          <div v-for="n in 6" :key="n" class="rounded-lg bg-accent/50 h-[56px] animate-pulse" />
        </div>

        <template v-else>
          <!-- Discovered clients — horizontal rows -->
          <section v-if="discovered.length">
            <h2 class="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase mb-3 px-1">
              Installed on this machine
            </h2>
            <div class="flex flex-col gap-1">
              <div
                v-for="client in discovered"
                :key="client.id"
                class="group flex items-center gap-4 rounded-lg px-4 py-3 transition-colors duration-150 cursor-pointer hover:bg-accent"
                @click="router.push(`/clients/${client.id}`)"
              >
                <!-- Logo -->
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden"
                  :style="{ backgroundColor: getMeta(client).color + '12' }"
                >
                  <img
                    v-if="getMeta(client).logo"
                    :src="getMeta(client).logo"
                    :alt="client.name"
                    class="h-5 w-5 object-contain"
                    @error="($event.target as HTMLImageElement).style.display = 'none'; ($event.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')"
                  />
                  <span class="hidden text-xs font-bold" :style="{ color: getMeta(client).color }">{{ clientInitial(client.name) }}</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-foreground truncate">{{ client.name }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ client.servers.length }} server{{ client.servers.length !== 1 ? 's' : '' }} configured
                    <span v-if="client.version" class="text-muted-foreground/40"> · v{{ client.version }}</span>
                  </p>
                </div>

                <!-- Status -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <div class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span class="text-[11px] text-muted-foreground/60 font-medium">Installed</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Separator -->
          <div v-if="discovered.length && notDiscovered.length" class="h-px bg-border" />

          <!-- Not discovered clients — compact grid -->
          <section v-if="notDiscovered.length">
            <h2 class="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase mb-3 px-1">
              Also supported
            </h2>
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-1">
              <div
                v-for="client in notDiscovered"
                :key="client.id"
                class="group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors duration-150 cursor-pointer hover:bg-accent"
                @click="router.push(`/clients/${client.id}`)"
              >
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-40 overflow-hidden"
                  :style="{ backgroundColor: getMeta(client).color + '10' }"
                >
                  <img
                    v-if="getMeta(client).logo"
                    :src="getMeta(client).logo"
                    :alt="client.name"
                    class="h-4 w-4 object-contain"
                    @error="($event.target as HTMLImageElement).style.display = 'none'; ($event.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')"
                  />
                  <span class="hidden text-[10px] font-bold" :style="{ color: getMeta(client).color }">{{ clientInitial(client.name) }}</span>
                </div>
                <span class="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">{{ client.name }}</span>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Apple-grade staggered reveal — cubic-bezier(0.16, 1, 0.3, 1) */
@keyframes ob-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Subtle continuous radar scan */
@keyframes ob-scan-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ob-reveal {
  opacity: 0;
  animation: ob-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.ob-d0 { animation-delay: 0.1s; }
.ob-d1 { animation-delay: 0.2s; }
.ob-d2 { animation-delay: 0.35s; }
.ob-d3 { animation-delay: 0.45s; }
.ob-d4 { animation-delay: 0.6s; }
.ob-d5 { animation-delay: 0.72s; }
.ob-d6 { animation-delay: 0.88s; }
.ob-d7 { animation-delay: 1.0s; }

.ob-scan {
  animation: ob-scan-rotate 8s linear infinite;
}
</style>
