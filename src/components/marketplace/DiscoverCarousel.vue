<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-vue-next'
import type { ListingDetail } from '@/mcp-providers/types'

const props = defineProps<{
  items: (ListingDetail | { id: string; slug: string; title: string; icon_url?: string | null; cover_image_url?: string | null; short_description?: string })[]
  loading?: boolean
}>()

const currentIndex = ref(0)
const paused = ref(false)

const maxIndex = computed(() => props.items.length - 1)

// ── Auto-advance ────────────────────────────────────────────────────

const INTERVAL_MS = 5000
let timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  stopTimer()
  if (props.items.length <= 1) return
  timer = setInterval(() => {
    if (!paused.value) next()
  }, INTERVAL_MS)
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
}

function resetTimer() {
  startTimer()
}

onMounted(() => startTimer())
onUnmounted(() => stopTimer())
watch(() => props.items.length, () => resetTimer())

// ── Navigation ──────────────────────────────────────────────────────

function prev() {
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : maxIndex.value
  resetTimer()
}

function next() {
  currentIndex.value = currentIndex.value < maxIndex.value ? currentIndex.value + 1 : 0
  resetTimer()
}

function goTo(idx: number) {
  currentIndex.value = idx
  resetTimer()
}

// ── Gradient fallback ───────────────────────────────────────────────

function itemGradient(item: { id?: string; slug?: string }) {
  const id = item.id ?? item.slug ?? ''
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const h2 = (hue + 45) % 360
  return `linear-gradient(135deg, hsl(${hue},65%,35%), hsl(${h2},75%,25%))`
}

</script>

<template>
  <section class="group/slider relative w-full mb-2">
    <!-- Loading state -->
    <div v-if="loading" class="h-[380px] w-full rounded-2xl bg-accent/50 flex items-center justify-center">
      <Loader2 class="h-8 w-8 text-muted-foreground animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="items.length === 0" class="h-[380px] w-full rounded-2xl bg-accent/50 flex items-center justify-center text-muted-foreground">
      No featured apps at the moment.
    </div>

    <!-- Slider -->
    <div v-else class="relative h-[380px] w-full overflow-hidden rounded-2xl shadow-2xl" @mouseenter="paused = true" @mouseleave="paused = false">
      
      <!-- Track -->
      <div 
        class="flex h-full w-full transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <router-link
          v-for="item in items"
          :key="item.id"
          :to="`/app-catalog/${item.slug}`"
          class="relative h-full min-w-full shrink-0 cursor-pointer overflow-hidden group/slide block"
          :style="{ background: item.cover_image_url ? '#111' : itemGradient(item) }"
        >
          <!-- Background Cover -->
          <img
            v-if="item.cover_image_url"
            :src="item.cover_image_url"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/slide:scale-105"
            alt=""
          />

          <!-- Decorative large icon fallback -->
          <div v-else-if="item.icon_url" class="absolute inset-0 flex items-center justify-center">
            <img :src="item.icon_url" class="h-32 w-32 object-contain opacity-30 blur-[1px]" alt="" />
          </div>

          <!-- Info overlay -->
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 pt-24">
            <div class="flex items-end gap-4">
              <img 
                v-if="item.icon_url" 
                :src="item.icon_url" 
                :alt="item.title"
                class="w-14 h-14 rounded-xl object-contain bg-white/10 backdrop-blur-sm p-1.5 border border-white/10 shadow-lg shrink-0"
              />
            </div>
          </div>
        </router-link>
      </div>

      <!-- Navigation Arrows -->
      <button
        @click.prevent="prev"
        class="absolute left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 group-hover/slider:opacity-100 shadow-xl border border-white/10"
      >
        <ChevronLeft class="h-7 w-7" />
      </button>

      <button
        @click.prevent="next"
        class="absolute right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 group-hover/slider:opacity-100 shadow-xl border border-white/10"
      >
        <ChevronRight class="h-7 w-7" />
      </button>

    </div>

    <!-- Pagination Indicators -->
    <div class="flex items-center justify-center gap-2 mt-4">
      <div 
        v-for="(_, idx) in items" 
        :key="idx"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="idx === currentIndex ? 'bg-foreground/50 w-6' : 'bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50 cursor-pointer'"
        @click.prevent="goTo(idx)"
      ></div>
    </div>
  </section>
</template>
