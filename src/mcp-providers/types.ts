/**
 * MCP Provider Architecture — Type Definitions
 *
 * This module defines the contract that marketplace providers must implement.
 * The type system uses discriminated unions to enable exhaustive pattern matching
 * across provider kinds, making it trivial to add new provider integrations.
 *
 * @example
 * ```ts
 * import type { McpProvider } from '@/mcp-providers/types'
 *
 * function renderProvider(p: McpProvider) {
 *   switch (p.kind) {
 *     case 'integrated': return p.marketplace.fetchListings()
 *     case 'external':   return window.open(p.siteUrl)
 *   }
 * }
 * ```
 */

// ── Provider Interfaces ─────────────────────────────────────────────

/** Shared metadata for every provider — integrated or external. */
export interface ProviderMeta {
  readonly id: string
  readonly name: string
  readonly siteUrl: string
}

/**
 * A fully integrated provider with marketplace API support.
 *
 * Integrated providers expose a `marketplace` object that implements
 * the full data-fetching contract (listings, search, detail, categories).
 * They are rendered as internal routes in the sidebar.
 */
export interface IntegratedProvider extends ProviderMeta {
  readonly kind: 'integrated'
  /** Internal vue-router path for this provider's dashboard. */
  readonly routePath: string
  /** Marketplace API surface. */
  readonly marketplace: ProviderMarketplace
}

/**
 * An external directory — link-only, no API integration.
 * Rendered as an outbound link in the sidebar navigation.
 */
export interface ExternalProvider extends ProviderMeta {
  readonly kind: 'external'
}

/** Discriminated union of all provider types. */
export type McpProvider = IntegratedProvider | ExternalProvider

// ── Marketplace Contract ────────────────────────────────────────────

/** The API surface that integrated providers must implement. */
export interface ProviderMarketplace {
  /** Fetch marquee items for the discovery carousel. */
  fetchMarqueeItems(): Promise<MarketplaceItem[]>

  /** Fetch all category groups (pills for the filter bar). */
  fetchCategoryGroups(): Promise<CategoryGroup[]>

  /** Fetch editorially curated category sections with nested listings. */
  fetchFeaturedSections(): Promise<FeaturedCategory[]>

  /** Fetch paginated listings with optional filters. */
  fetchListings(query?: ListingsQuery): Promise<PaginatedResponse<ListingDetail>>

  /** Fetch full detail for a single listing by slug. */
  fetchListingDetail(slug: string): Promise<ListingDetail | null>

  /** Full-text search across all listings. */
  searchListings(query: string, page?: number): Promise<SearchResponse>
}

// ── Query & Response Wrappers ───────────────────────────────────────

/** Parameters for paginated listing queries. */
export interface ListingsQuery {
  page?: number
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc'
  category?: string | null
  parent_category?: string | null
  tag?: string | null
}

/** Generic paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/** Pagination metadata matching the API shape. */
export interface PaginationMeta {
  total: number
  current_page: number
  last_page: number
  per_page: number
}

// ── Category Types ──────────────────────────────────────────────────

/** A category pill shown in the filter bar. */
export interface CategoryGroup {
  slug: string
  label: string
  listing_count: number
  lucide_icon?: string | null
  is_featured?: boolean
}

/**
 * An editorially curated category section with nested listings.
 * Used for the "Loved by Devs", "AI Frontier" etc. carousel sections.
 */
export interface FeaturedCategory {
  slug: string
  label: string
  lucide_icon: string | null
  color: string | null
  sort_order: number
  listings: ListingDetail[]
}

// ── Marketplace Data Types ──────────────────────────────────────────

/** A lightweight listing summary used in carousels and grids. */
export interface MarketplaceItem {
  id: string
  slug: string
  title: string
  icon_url?: string | null
  cover_image_url?: string | null
}

/** Full listing detail returned by the provider API. */
export interface ListingDetail {
  id: string
  slug: string
  title: string
  short_description: string
  description: string
  listing_type: 'paid' | 'free'
  server_type?: string
  price_cents: number
  categories?: string[]
  category?: string | null
  tools_count?: number
  seller: {
    display_name: string
    avatar?: string | null
    is_verified?: boolean
  }
  tools?: Tool[]
  prompt_examples?: PromptExample[] | null
  icon_url?: string | null
  cover_image_url?: string | null
  integration?: {
    name?: string
    url?: string
  } | null
  is_own_listing?: boolean
  buyer_subscription_id?: string | null
  buyer_server_id?: string | null
  has_active_plan?: boolean
  category_listings?: Partial<ListingDetail>[]
  related_listings?: Partial<ListingDetail>[]
}

/** A single tool/capability exposed by an MCP server. */
export interface Tool {
  name: string
  description?: string
}

/** A prompt/response example showcased on the listing detail page. */
export interface PromptExample {
  prompt: string
  response: string
}

/** Individual search result with summary metadata. */
export interface SearchResult {
  id: string
  slug: string
  title: string
  short_description: string
  server_type?: string
  tools_count: number
  icon_url?: string | null
  cover_image_url?: string | null
  seller?: {
    display_name?: string
    is_verified?: boolean
  }
}

/** Paginated search response. */
export interface SearchResponse {
  results: SearchResult[]
  has_more: boolean
}
