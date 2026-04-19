<script setup lang="ts">
/**
 * FeaturedSections — Dashboard editorial carousels.
 * Delegates all card rendering and scroll behaviour to HorizontalCardCarousel.
 */
import HorizontalCardCarousel from '@/components/marketplace/HorizontalCardCarousel.vue'
import type { FeaturedCategory } from '@/mcp-providers/types'

defineProps<{
  sections: FeaturedCategory[]
  loading?: boolean
}>()
</script>

<template>
  <!-- Loading skeletons -->
  <div v-if="loading" class="space-y-10">
    <div v-for="n in 3" :key="n" class="space-y-4">
      <div class="h-5 w-40 rounded bg-white/[0.06] animate-pulse" />
      <div class="flex gap-4 overflow-hidden">
        <div v-for="s in 5" :key="s" class="w-[260px] shrink-0">
          <div class="aspect-[16/8] bg-white/[0.04] rounded-2xl animate-pulse" />
          <div class="p-3 space-y-2">
            <div class="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
            <div class="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Featured category carousels -->
  <template v-else>
    <HorizontalCardCarousel
      v-for="section in sections"
      :key="section.slug"
      :title="section.label"
      :items="section.listings"
      :card-width="260"
    />
  </template>
</template>
