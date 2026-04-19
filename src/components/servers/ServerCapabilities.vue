<script setup lang="ts">
import { Loader2, Wrench, FileText, MessageSquare } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { IntrospectionResult } from '@/composables/useMcpIntrospection'

defineProps<{
  result: IntrospectionResult | null
  loading: boolean
  error: string | null
}>()

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="space-y-4">

    <!-- Loading -->
    <p v-if="loading" class="text-sm text-muted-foreground flex items-center gap-2">
      <Loader2 class="h-4 w-4 animate-spin shrink-0" />
      Discovering capabilities…
    </p>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-muted-foreground">
      Could not connect to this server.
      <span class="underline cursor-pointer hover:text-white transition-colors" @click="$emit('retry')">Retry</span>
    </p>

    <!-- Results -->
    <template v-else-if="result">

      <!-- Server Info -->
      <div v-if="result.server_info" class="text-xs text-muted-foreground/60">
        {{ result.server_info.name }}
        <span v-if="result.server_info.version"> v{{ result.server_info.version }}</span>
      </div>

      <!-- Tools -->
      <div class="space-y-2">
        <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          <Wrench class="w-3.5 h-3.5" />
          Tools
          <span class="text-muted-foreground/40 font-normal normal-case">{{ result.tools.length }}</span>
        </Label>
        <div v-if="result.tools.length > 0" class="divide-y divide-white/[0.04]">
          <div
            v-for="tool in result.tools"
            :key="tool.name"
            class="py-2.5"
          >
            <p class="text-sm font-semibold text-white font-mono">{{ tool.name }}</p>
            <p v-if="tool.description" class="text-sm text-muted-foreground mt-0.5 line-clamp-2">{{ tool.description }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-muted-foreground/40 italic">No tools exposed.</p>
      </div>

      <Separator class="bg-white/[0.04]" />

      <!-- Resources -->
      <div class="space-y-2">
        <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          <FileText class="w-3.5 h-3.5" />
          Resources
          <span class="text-muted-foreground/40 font-normal normal-case">{{ result.resources.length }}</span>
        </Label>
        <div v-if="result.resources.length > 0" class="divide-y divide-white/[0.04]">
          <div
            v-for="resource in result.resources"
            :key="resource.uri"
            class="py-2.5"
          >
            <p class="text-sm font-semibold text-white font-mono">{{ resource.name || resource.uri }}</p>
            <p v-if="resource.description" class="text-sm text-muted-foreground mt-0.5 line-clamp-2">{{ resource.description }}</p>
            <p v-if="resource.mimeType" class="text-xs text-muted-foreground/40 mt-1 font-mono">{{ resource.mimeType }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-muted-foreground/40 italic">No resources exposed.</p>
      </div>

      <Separator class="bg-white/[0.04]" />

      <!-- Prompts -->
      <div class="space-y-2">
        <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
          <MessageSquare class="w-3.5 h-3.5" />
          Prompts
          <span class="text-muted-foreground/40 font-normal normal-case">{{ result.prompts.length }}</span>
        </Label>
        <div v-if="result.prompts.length > 0" class="divide-y divide-white/[0.04]">
          <div
            v-for="prompt in result.prompts"
            :key="prompt.name"
            class="py-2.5"
          >
            <p class="text-sm font-semibold text-white font-mono">{{ prompt.name }}</p>
            <p v-if="prompt.description" class="text-sm text-muted-foreground mt-0.5 line-clamp-2">{{ prompt.description }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-muted-foreground/40 italic">No prompts exposed.</p>
      </div>
    </template>

  </div>
</template>
