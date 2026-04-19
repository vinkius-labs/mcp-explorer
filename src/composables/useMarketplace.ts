import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDefaultProvider } from '@/mcp-providers/registry'
import type {
  MarketplaceItem,
  ListingDetail,
  CategoryGroup,
  FeaturedCategory,
  PaginationMeta,
} from '@/mcp-providers/types'

/**
 * Composable for the full marketplace experience.
 *
 * **Navigation-aware**: category and page state are derived from the
 * vue-router query string (`?category=&page=`), so every filter change
 * pushes a history entry. The TitleBar's back/forward buttons (which
 * call `router.back()` / `router.forward()`) work automatically.
 *
 * Layout order (matches the Site):
 *   1. Marquee items     → DiscoverCarousel
 *   2. Featured sections → FeaturedSections (editorial carousels)
 *   3. Category groups   → CategoryPills (filter bar)
 *   4. Paginated listings → Grid with pagination
 */
export function useMarketplace() {
  const { marketplace } = getDefaultProvider()
  const route = useRoute()
  const router = useRouter()

  // ── Loading states ──────────────────────────────────────────────
  const loading = ref(false)
  const loadingSections = ref(false)
  const error = ref<string | null>(null)

  // ── Data ────────────────────────────────────────────────────────
  const marqueeItems = ref<MarketplaceItem[]>([])
  const categoryGroups = ref<CategoryGroup[]>([])
  const featuredSections = ref<FeaturedCategory[]>([])
  const listings = ref<ListingDetail[]>([])
  const paginationMeta = ref<PaginationMeta | null>(null)

  // ── Route-derived state (single source of truth) ────────────────
  const currentPage = computed(() => {
    const p = Number(route.query.page)
    return p > 0 ? p : 1
  })

  const selectedCategory = computed(() => {
    return (route.query.category as string) || null
  })

  // ── Fetch functions ─────────────────────────────────────────────

  async function fetchMarqueeItems() {
    try {
      marqueeItems.value = await marketplace.fetchMarqueeItems()
    } catch (err) {
      console.error('Failed to fetch marquee items', err)
    }
  }

  async function fetchCategoryGroups() {
    try {
      categoryGroups.value = await marketplace.fetchCategoryGroups()
    } catch (err) {
      console.error('Failed to fetch category groups', err)
    }
  }

  async function fetchFeaturedSections() {
    loadingSections.value = true
    try {
      featuredSections.value = await marketplace.fetchFeaturedSections()
    } catch (err) {
      console.error('Failed to fetch featured sections', err)
    } finally {
      loadingSections.value = false
    }
  }

  async function fetchListings() {
    loading.value = true
    error.value = null
    try {
      const response = await marketplace.fetchListings({
        page: currentPage.value,
        sort: 'popular',
        category: selectedCategory.value,
      })
      listings.value = response.data
      paginationMeta.value = response.meta
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch listings'
      console.error('Failed to fetch listings', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchListingDetail(slug: string): Promise<ListingDetail | null> {
    loading.value = true
    error.value = null
    try {
      return await marketplace.fetchListingDetail(slug)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load listing details'
      return null
    } finally {
      loading.value = false
    }
  }

  // ── Navigation actions (push to router → watchers re-fetch) ─────

  /**
   * Select a category. Pushes `?category=slug` to the router.
   * Passing `null` clears the filter (returns to homepage).
   */
  function selectCategory(slug: string | null) {
    const query: Record<string, string> = {}
    if (slug) query.category = slug
    // Reset page when changing category
    router.push({ path: '/dashboard', query })
  }

  /**
   * Navigate to a specific page. Preserves current category filter.
   */
  function goToPage(page: number) {
    const query: Record<string, string> = {}
    if (selectedCategory.value) query.category = selectedCategory.value
    if (page > 1) query.page = String(page)
    router.push({ path: '/dashboard', query })
  }

  // ── Watchers — refetch listings when route query changes ────────

  watch(
    () => route.query,
    () => {
      // Only refetch when we're on the dashboard
      if (route.path === '/dashboard' || route.path === '/') {
        fetchListings()
      }
    },
  )

  // ── Init ────────────────────────────────────────────────────────

  onMounted(() => {
    fetchMarqueeItems()
    fetchCategoryGroups()
    fetchFeaturedSections()
    fetchListings()
  })

  return {
    // State
    loading,
    loadingSections,
    error,
    marqueeItems,
    categoryGroups,
    featuredSections,
    listings,
    paginationMeta,
    currentPage,
    selectedCategory,

    // Navigation actions
    selectCategory,
    goToPage,
    fetchListingDetail,
    refresh: () => {
      fetchMarqueeItems()
      fetchCategoryGroups()
      fetchFeaturedSections()
      fetchListings()
    },
  }
}

// Re-export types for consumer convenience
export type {
  MarketplaceItem,
  ListingDetail,
  CategoryGroup,
  FeaturedCategory,
  PaginationMeta,
} from '@/mcp-providers/types'
