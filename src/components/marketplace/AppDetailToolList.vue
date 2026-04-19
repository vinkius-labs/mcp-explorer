<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Wrench, Clock } from 'lucide-vue-next'
import type { Tool } from '@/mcp-providers/types'

defineProps<{
  tools: Tool[]
}>()
</script>

<template>
  <div>
    <!-- Section header -->
    <div class="flex items-baseline justify-between gap-4 mb-3">
      <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
        Capabilities
      </Label>
      <span class="text-xs font-medium text-muted-foreground/40 tabular-nums">
        {{ tools.length }} tools
      </span>
    </div>

    <!-- Column headers -->
    <div class="grid grid-cols-[44px_1fr_60px] px-4 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
      <div class="text-center">#</div>
      <div>Tool Function</div>
      <div class="flex justify-end items-center text-muted-foreground/50">
        <Clock class="w-3.5 h-3.5" />
      </div>
    </div>

    <div class="h-px bg-border my-2" />

    <!-- Tool rows -->
    <div
      v-for="(tool, index) in tools"
      :key="tool.name"
      class="group grid grid-cols-[44px_1fr_60px] items-center px-4 py-2 rounded-md transition-colors duration-150 cursor-default hover:bg-accent"
    >
      <div class="flex items-center justify-center text-sm font-medium text-muted-foreground">
        <span class="block tabular-nums group-hover:hidden">{{ index + 1 }}</span>
        <Wrench class="hidden w-4 h-4 text-foreground group-hover:block" />
      </div>
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="text-sm font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis font-mono">
          {{ tool.name }}
        </span>
        <span v-if="tool.description" class="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {{ tool.description }}
        </span>
      </div>
      <div class="flex justify-end items-center">
        <span class="text-[11px] text-muted-foreground/50 tabular-nums font-mono">MCP</span>
      </div>
    </div>
  </div>
</template>
