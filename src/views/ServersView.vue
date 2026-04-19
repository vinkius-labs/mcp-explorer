<script setup lang="ts">
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import ServerMatrix from '@/components/servers/ServerMatrix.vue'

const search = ref('')
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex-none px-6 py-3 shrink-0 relative z-20 bg-background flex items-baseline justify-between gap-4">
      <h1 class="text-xl font-bold tracking-tight text-foreground leading-normal shrink-0">
        My MCP Servers
      </h1>
      <p class="text-muted-foreground text-sm flex-1 truncate">MCP servers currently configured across your discovered AI clients.</p>
      <div class="relative w-56 shrink-0 self-center">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
        <Input
          v-model="search"
          placeholder="Filter servers..."
          class="pl-9 h-8 rounded-full bg-accent/50 border-transparent hover:bg-accent focus:bg-accent focus-visible:ring-1 focus-visible:ring-ring text-sm placeholder:text-muted-foreground/50 transition-colors shadow-none"
        />
      </div>
    </div>

    <!-- Table scroll container -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 relative">
      <ServerMatrix v-model:search="search" />
    </div>
  </div>
</template>
