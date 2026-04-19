<script setup lang="ts">
import { useDiscovery } from '@/composables/useDiscovery'
import ClientCard from './ClientCard.vue'
import { Loader2 } from 'lucide-vue-next'

const { clients, loading } = useDiscovery()
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
    <Loader2 class="h-4 w-4 animate-spin" />
    Discovering clients...
  </div>

  <!-- Client grid (Spotify-style) -->
  <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    <ClientCard
      v-for="client in clients"
      :key="client.id"
      :client="client"
    />
  </div>
</template>
