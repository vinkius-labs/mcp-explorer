<script setup lang="ts">
/**
 * Minimal titlebar — includes history navigation, search, and window controls.
 * Drag region is handled by the parent container.
 */
import { ChevronLeft, ChevronRight, Minus, Square, X } from 'lucide-vue-next'
import { isTauri } from '@/composables/useTauri'
import { useRouter } from 'vue-router'
import AppSearch from '@/components/layout/AppSearch.vue'

const router = useRouter()

async function minimize() {
  if (!isTauri) return
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  getCurrentWindow().minimize()
}

async function toggleMaximize() {
  if (!isTauri) return
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  getCurrentWindow().toggleMaximize()
}

async function close() {
  if (!isTauri) return
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  getCurrentWindow().close()
}
</script>

<template>
  <div class="absolute top-0 left-0 w-full h-16 pointer-events-none flex items-center">

    <!-- Logo — sits inside the sidebar column (220px wide) -->
    <div class="absolute left-0 w-[220px] flex items-center justify-start pl-5 z-50">
      <img
        src="https://site-assets.vinkius.com/vk/logo-black-min.png"
        alt="Vinkius"
        class="h-7 w-auto select-none logo-theme"
        draggable="false"
      />
    </div>
    
    <!-- Persistent Navigation & Search -->
    <div class="absolute left-[240px] flex items-center gap-2 pointer-events-auto z-50">
      <button 
        @click="router.back()" 
        class="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
      >
        <ChevronLeft class="h-5 w-5 pr-0.5" />
      </button>
      <button 
        @click="router.forward()" 
        class="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
      >
        <ChevronRight class="h-5 w-5 pl-0.5" />
      </button>

      <!-- Global Search Bar -->
      <AppSearch />
    </div>

    <!-- Window controls -->
    <div
      v-if="isTauri"
      class="absolute top-0 right-0 z-50 flex items-center pointer-events-auto"
    >
      <button
        class="flex h-8 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
        @click="minimize"
      >
        <Minus class="h-3.5 w-3.5" />
      </button>
      <button
        class="flex h-8 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
        @click="toggleMaximize"
      >
        <Square class="h-3 w-3" />
      </button>
      <button
        class="flex h-8 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-red-500 hover:text-white"
        @click="close"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Light mode: force logo letters to pure black */
.logo-theme {
  filter: brightness(0) !important;
}

/* Dark mode: no filter, show original logo */
:root.dark .logo-theme,
.dark .logo-theme {
  filter: none !important;
}
</style>
