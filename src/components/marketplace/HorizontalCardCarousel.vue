<script setup lang="ts">
/**
 * HorizontalCardCarousel — Single source of truth for all scrollable
 * ListingCard rows across the app (Dashboard featured sections, Detail
 * page "More in this category", "You might also like", etc.)
 *
 * Standardises card width, arrow style, scroll behaviour, and overflow
 * detection so every horizontally-scrollable card row is identical.
 */
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ListingCard from '@/components/marketplace/ListingCard.vue'
import type { MarketplaceItem } from '@/mcp-providers/types'

const props = withDefaults(
  defineProps<{
    title: string
    items: MarketplaceItem[]
    /** Card width in pixels */
    cardWidth?: number
  }>(),
  {
    cardWidth: 260,
  },
)

// ── Scroll state ────────────────────────────────────────────────────

const trackRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const hasOverflow = ref(false)

function updateScrollState() {
  const el = trackRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
  hasOverflow.value = el.scrollWidth > el.clientWidth + 4
}

function scroll(direction: 'left' | 'right') {
  const el = trackRef.value
  if (!el) return
  const amount = props.cardWidth + 16 // card width + gap
  el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' })
}

// Watch for content/resize changes
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => updateScrollState())
  watch(trackRef, (el) => {
    if (el) {
      resizeObserver?.observe(el)
      nextTick(updateScrollState)
    }
  }, { immediate: true })
})

onUnmounted(() => resizeObserver?.disconnect())

watch(() => props.items.length, () => nextTick(updateScrollState))


</script>

<template>
  <section v-if="items.length">
    <!-- Header + arrows -->
    <div class="flex items-center justify-between mb-5 px-1">
      <h2 class="text-lg font-bold text-white tracking-tight">{{ title }}</h2>
      <div v-if="hasOverflow" class="flex items-center gap-1.5 shrink-0">
        <button
          :disabled="!canScrollLeft"
          class="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-default cursor-pointer"
          @click="scroll('left')"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          :disabled="!canScrollRight"
          class="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-default cursor-pointer"
          @click="scroll('right')"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Track -->
    <div
      ref="trackRef"
      class="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      @scroll="updateScrollState"
    >
      <ListingCard
        v-for="item in items"
        :key="item.id"
        :listing="item"
        class="shrink-0"
        :style="{ width: `${cardWidth}px` }"
        aspect-ratio="16/8"
      />
    </div>
  </section>
</template>
