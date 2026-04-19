<script setup lang="ts">
import type { ListingDetail } from '@/mcp-providers/types'

defineProps<{
  listing: ListingDetail
}>()
</script>

<template>
  <div>
    <!-- Cover image only -->
    <section class="relative h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden -mt-2">
      <img
        v-if="listing.cover_image_url"
        :src="listing.cover_image_url"
        alt=""
        aria-hidden="true"
        class="w-full h-full object-cover object-[center_20%]"
      />
      <div v-else class="w-full h-full bg-secondary" />
      <div class="absolute inset-0 hero-gradient" />
    </section>
  </div>
</template>

<style scoped>
.hero-gradient {
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 40%,
    hsl(var(--background) / 0.55) 70%,
    hsl(var(--background)) 100%
  );
}
</style>
