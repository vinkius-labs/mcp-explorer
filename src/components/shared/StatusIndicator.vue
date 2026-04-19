<script setup lang="ts">
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-vue-next'

defineProps<{
  status: 'healthy' | 'error' | 'loading'
  label?: string
}>()
</script>

<template>
  <div class="flex items-center gap-1.5 text-xs">
    <Loader2 v-if="status === 'loading'" class="h-3 w-3 animate-spin text-muted-foreground" />
    <CheckCircle2 v-else-if="status === 'healthy'" class="h-3 w-3 text-white" />
    <AlertCircle v-else class="h-3 w-3 text-destructive" />
    <span
      :class="{
        'text-muted-foreground': status === 'loading',
        'text-white': status === 'healthy',
        'text-destructive': status === 'error',
      }"
    >
      {{ label ?? status }}
    </span>
  </div>
</template>
