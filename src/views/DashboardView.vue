<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDiscovery } from '@/composables/useDiscovery'
import { useMarketplace } from '@/composables/useMarketplace'
import { ChevronLeft, ChevronRight, Share2, Check } from 'lucide-vue-next'
import { getDefaultProvider } from '@/mcp-providers/registry'
import DiscoverCarousel from '@/components/marketplace/DiscoverCarousel.vue'
import ListingCard from '@/components/marketplace/ListingCard.vue'
import { Button } from '@/components/ui/button'

useDiscovery() // Keep discovery lifecycle running

const {
  loading,
  listings,
  categoryGroups,
  featuredSections,
  paginationMeta,
  currentPage,
  selectedCategory,
  selectCategory,
  goToPage,
} = useMarketplace()

const { siteUrl } = getDefaultProvider()

/** Show hero only on the "home" state (no category selected, page 1) */
const isHomepage = computed(() => !selectedCategory.value && currentPage.value === 1)

/** Hero items: first featured section's listings (matches Site marquee showcase) */
const heroItems = computed(() => {
  if (!featuredSections.value.length) return []
  // Flatten featured sections, deduplicate by id, keep items with covers
  const seen = new Set<string>()
  return featuredSections.value
    .flatMap(s => s.listings)
    .filter(l => {
      if (!l.cover_image_url || seen.has(l.id)) return false
      seen.add(l.id)
      return true
    })
    .slice(0, 20)
})
const showStickyHeader = computed(() => !isHomepage.value)

const headerTitle = computed(() => {
  if (selectedCategory.value) {
    const group = categoryGroups.value.find((g) => g.slug === selectedCategory.value)
    return group?.label ?? selectedCategory.value
  }
  return 'Registry'
})

const headerDescription = computed(() => {
  if (paginationMeta.value && currentPage.value > 1) {
    return `Page ${currentPage.value} of ${paginationMeta.value.last_page}`
  }
  if (paginationMeta.value && selectedCategory.value) {
    return `${paginationMeta.value.total} apps`
  }
  return null
})

/** Build the corresponding website URL for sharing */
const shareUrl = computed(() => {
  const base = `${siteUrl}/en`
  
  if (selectedCategory.value) {
    if (currentPage.value > 1) {
      return `${base}/category/${selectedCategory.value}/page/${currentPage.value}`
    }
    return `${base}/category/${selectedCategory.value}`
  }
  
  if (currentPage.value > 1) {
    return `${base}/page/${currentPage.value}`
  }
  
  return base
})

const copied = ref(false)

async function handleShare() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback — silent fail
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- Sticky header: shown when not on homepage -->
    <div
      v-if="showStickyHeader"
      class="flex-none px-6 py-3 shrink-0 bg-background flex items-baseline justify-between gap-4"
    >
      <div class="flex items-baseline gap-3 min-w-0">
        <h1 class="text-xl font-bold tracking-tight text-foreground leading-normal truncate">
          {{ headerTitle }}
        </h1>
        <span v-if="headerDescription" class="text-muted-foreground text-sm shrink-0">
          {{ headerDescription }}
        </span>
      </div>
      <Button variant="ghost" size="sm" class="text-muted-foreground shrink-0" @click="handleShare">
        <Check v-if="copied" class="h-3.5 w-3.5 mr-1.5" />
        <Share2 v-else class="h-3.5 w-3.5 mr-1.5" />
        {{ copied ? 'Copied' : 'Share' }}
      </Button>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 overflow-y-auto">
      <div class="flex flex-col gap-8 p-6">

        <!-- DISCOVER CAROUSEL (homepage only) -->
        <DiscoverCarousel v-if="isHomepage" :items="heroItems" :loading="loading" />

        <!-- LISTING GRID with PAGINATION -->
        <section>
          <!-- Loading skeletons -->
          <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div v-for="n in 12" :key="n" class="rounded-2xl overflow-hidden">
              <div class="aspect-[16/8] bg-white/[0.04] rounded-2xl animate-pulse" />
              <div class="p-3 space-y-2">
                <div class="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
                <div class="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!listings.length"
            class="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <div class="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
              <svg class="w-7 h-7 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="m8 8 6 6" />
              </svg>
            </div>
            <div class="space-y-1">
              <p class="text-base font-semibold text-foreground">No results found</p>
              <p class="text-sm text-muted-foreground">Try selecting a different category</p>
            </div>
            <button
              class="mt-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-border bg-transparent text-foreground hover:bg-accent transition-colors cursor-pointer"
              @click="selectCategory(null)"
            >
              Clear filters
            </button>
          </div>

          <!-- Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ListingCard
              v-for="listing in listings"
              :key="listing.id"
              :listing="listing"
              aspect-ratio="16/8"
            />
          </div>

          <!-- Pagination -->
          <div
            v-if="paginationMeta && paginationMeta.last_page > 1"
            class="flex items-center justify-center gap-4 pt-8"
          >
            <button
              :disabled="paginationMeta.current_page <= 1"
              class="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-transparent text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              @click="goToPage(paginationMeta!.current_page - 1)"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <span class="text-sm text-muted-foreground font-mono tabular-nums">
              {{ paginationMeta.current_page }} / {{ paginationMeta.last_page }}
            </span>
            <button
              :disabled="paginationMeta.current_page >= paginationMeta.last_page"
              class="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-transparent text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              @click="goToPage(paginationMeta!.current_page + 1)"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
