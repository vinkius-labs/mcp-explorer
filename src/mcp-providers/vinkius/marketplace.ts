/**
 * Vinkius Cloud — Marketplace Implementation
 *
 * Implements the `ProviderMarketplace` contract for the Vinkius Cloud API.
 * Each method maps 1:1 to a Cloud API endpoint and normalizes the response
 * into the standard marketplace types.
 *
 * Endpoint mapping:
 *   fetchMarqueeItems()      → GET /marketplace/categories         (marquee field)
 *   fetchCategoryGroups()    → GET /marketplace/categories         (categories field)
 *   fetchFeaturedSections()  → GET /marketplace/categories/featured
 *   fetchListings()          → GET /marketplace/listings?page=&sort=&category=
 *   fetchListingDetail()     → GET /marketplace/listings/:slug
 *   searchListings()         → GET /marketplace/search?q=&page=
 */

import { apiFetch } from './api'
import type {
  ProviderMarketplace,
  MarketplaceItem,
  ListingDetail,
  SearchResponse,
  CategoryGroup,
  FeaturedCategory,
  ListingsQuery,
  PaginatedResponse,
  PaginationMeta,
} from '../types'

// ── Cached category response (marquee + groups come from the same endpoint) ──

interface CategoriesRaw {
  marquee?: MarketplaceItem[]
  categories?: CategoryGroup[]
  data?: CategoryGroup[]
}

let categoriesCache: CategoriesRaw | null = null

async function fetchCategoriesRaw(): Promise<CategoriesRaw> {
  if (categoriesCache) return categoriesCache
  categoriesCache = await apiFetch<CategoriesRaw>('/marketplace/categories')
  return categoriesCache
}

/**
 * Create a marketplace implementation backed by the Vinkius Cloud API.
 *
 * This factory pattern keeps the marketplace stateless and testable —
 * no singleton state, no side effects at import time.
 */
export function createMarketplace(): ProviderMarketplace {
  return {
    async fetchMarqueeItems(): Promise<MarketplaceItem[]> {
      const raw = await fetchCategoriesRaw()
      return raw.marquee ?? []
    },

    async fetchCategoryGroups(): Promise<CategoryGroup[]> {
      const raw = await fetchCategoriesRaw()
      const groups = raw.categories ?? raw.data ?? []
      return groups.filter((g) => g.slug !== 'other')
    },

    async fetchFeaturedSections(): Promise<FeaturedCategory[]> {
      try {
        const data = await apiFetch<FeaturedCategory[] | { data: FeaturedCategory[] }>(
          '/marketplace/categories/featured',
        )
        return Array.isArray(data) ? data : data.data ?? []
      } catch {
        return []
      }
    },

    async fetchListings(query?: ListingsQuery): Promise<PaginatedResponse<ListingDetail>> {
      const params = new URLSearchParams()
      params.set('page', String(query?.page ?? 1))
      params.set('sort', query?.sort ?? 'popular')
      if (query?.category) params.set('category', query.category)
      if (query?.parent_category) params.set('parent_category', query.parent_category)
      if (query?.tag) params.set('tag', query.tag)

      try {
        const raw = await apiFetch<{ data?: ListingDetail[]; total?: number; current_page?: number; last_page?: number; per_page?: number }>(`/marketplace/listings?${params.toString()}`)

        // Normalize — API may return { data: [...], total, current_page, ... } or plain array
        const listings: ListingDetail[] = Array.isArray(raw) ? raw : (raw.data ?? [])
        const meta: PaginationMeta = {
          total: raw.total ?? listings.length,
          current_page: raw.current_page ?? 1,
          last_page: raw.last_page ?? 1,
          per_page: raw.per_page ?? listings.length,
        }

        return { data: listings, meta }
      } catch {
        return { data: [], meta: { total: 0, current_page: 1, last_page: 1, per_page: 20 } }
      }
    },

    async fetchListingDetail(slug: string): Promise<ListingDetail | null> {
      try {
        const payload = await apiFetch<{ data?: { listing?: ListingDetail; category_listings?: ListingDetail[]; related_listings?: ListingDetail[] } }>(
          `/marketplace/item/${encodeURIComponent(slug)}`,
        )
        const data = (payload.data ?? payload) as { listing?: ListingDetail; category_listings?: ListingDetail[]; related_listings?: ListingDetail[] }
        if (data && 'listing' in data) {
          return {
            ...data.listing,
            category_listings: data.category_listings ?? [],
            related_listings: data.related_listings ?? []
          } as ListingDetail
        }
        return data as ListingDetail
      } catch {
        return null
      }
    },

    async searchListings(query: string, page = 1): Promise<SearchResponse> {
      try {
        return await apiFetch<SearchResponse>(
          `/marketplace/search?q=${encodeURIComponent(query)}&page=${page}`,
        )
      } catch {
        return { results: [], has_more: false }
      }
    },
  }
}
