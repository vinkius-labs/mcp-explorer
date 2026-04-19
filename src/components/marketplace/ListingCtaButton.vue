<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Cable, Zap, CheckCircle2 } from 'lucide-vue-next'

defineProps<{
  isInstalled: boolean
  authenticated: boolean
}>()

const emit = defineEmits<{
  install: []
}>()
</script>

<template>
  <Button
    v-if="isInstalled"
    variant="outline"
    size="sm"
    class="gap-2 shrink-0"
    disabled
  >
    <CheckCircle2 class="w-4 h-4" />
    Installed
  </Button>

  <Button
    v-else-if="authenticated"
    size="sm"
    class="gap-2 shrink-0"
    @click="emit('install')"
  >
    <Zap class="w-4 h-4" />
    Get to Use
  </Button>

  <Button
    v-else
    size="sm"
    class="gap-2 shrink-0"
    @click="emit('install')"
  >
    <Cable class="w-4 h-4" />
    Get MCP Server (Free)
  </Button>
</template>
