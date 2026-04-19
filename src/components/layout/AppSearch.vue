<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Package } from 'lucide-vue-next'
import { getDefaultProvider } from '@/mcp-providers/registry'
import type { SearchResult } from '@/mcp-providers/types'

const router = useRouter()
const { marketplace } = getDefaultProvider()

const open = ref(false)
const query = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const results = ref<SearchResult[]>([])
const selectedIndex = ref(0)
const page = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)
const scrollRef = ref<HTMLDivElement | null>(null)
const sentinelRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const flatItems = computed(() => {
  const items: { type: 'result'; item: SearchResult }[] = []
  for (const r of results.value) {
    items.push({ type: 'result', item: r })
  }
  return items
})

const groupedResults = computed(() => {
  const groups: Record<string, SearchResult[]> = {}
  for (const r of results.value) {
    const type = r.server_type || 'api'
    if (!groups[type]) groups[type] = []
    groups[type].push(r)
  }
  return groups
})

const hasResults = computed(() => results.value.length > 0)

const groupLabel = (type: string) => {
  switch (type) {
    case 'skills': return 'Skills'
    default: return 'MCP Servers'
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function doSearch(q: string, isLoadMore = false) {
  if (q.length < 2) {
    results.value = []
    loading.value = false
    hasMore.value = false
    return
  }

  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const response = await marketplace.searchListings(q, page.value)

    if (isLoadMore) {
      results.value = [...results.value, ...response.results]
    } else {
      results.value = response.results
      selectedIndex.value = 0
    }
    hasMore.value = response.has_more
  } catch {
    if (!isLoadMore) results.value = []
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadNextPage() {
  if (!hasMore.value || loadingMore.value || loading.value) return
  page.value++
  doSearch(query.value.trim(), true)
}

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  page.value = 1
  if (val.trim().length >= 2) {
    loading.value = true
    debounceTimer = setTimeout(() => doSearch(val.trim()), 300)
  } else {
    results.value = []
    loading.value = false
    hasMore.value = false
  }
})

watch(open, (isOpen) => {
  if (isOpen) {
    setTimeout(() => inputRef.value?.focus(), 50)
    setupObserver()
  } else {
    query.value = ''
    results.value = []
    loading.value = false
    loadingMore.value = false
    selectedIndex.value = 0
    page.value = 1
    hasMore.value = false
    teardownObserver()
  }
})

function setupObserver() {
  teardownObserver()
  setTimeout(() => {
    if (!sentinelRef.value) return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextPage()
      },
      { root: scrollRef.value, threshold: 0.1 },
    )
    observer.observe(sentinelRef.value)
  }, 100)
}

function teardownObserver() {
  observer?.disconnect()
  observer = null
}

watch(results, () => {
  if (open.value && hasMore.value) {
    setTimeout(() => {
      if (sentinelRef.value && observer) {
        observer.disconnect()
        observer.observe(sentinelRef.value)
      } else if (sentinelRef.value) {
        setupObserver()
      }
    }, 50)
  }
})

function selectResult(result: SearchResult) {
  open.value = false
  router.push(`/app-catalog/${result.slug || result.id}`)
}

function iconLetter(title: string) {
  return (title?.charAt(0) ?? 'M').toUpperCase()
}

function onInputKeydown(e: KeyboardEvent) {
  const count = flatItems.value.length
  if (!count) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % count
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + count) % count
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = flatItems.value[selectedIndex.value]
    if (selected) selectResult(selected.item)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <!-- Spotify Style Search Trigger -->
  <div class="relative group ml-4 cursor-text" @click="open = true">
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Search class="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </div>
    <div class="flex h-10 w-80 items-center justify-between rounded-full bg-secondary px-3 pl-10 pr-4 text-sm font-medium text-muted-foreground/60 transition-colors hover:bg-accent border border-border">
      Search for MCP servers and tools
      <kbd class="hidden sm:inline-flex items-center rounded bg-accent px-1 font-sans text-xs font-medium text-muted-foreground border border-border group-hover:text-foreground/60">
        <span class="mr-0.5">⌘</span>K
      </kbd>
    </div>
  </div>

  <!-- Search Dialog -->
  <Dialog v-model:open="open">
    <DialogContent class="overflow-hidden p-0 max-w-[540px] gap-0 rounded-xl border-border bg-popover text-foreground">
      <DialogHeader class="sr-only">
        <DialogTitle>Search</DialogTitle>
        <DialogDescription>Search for apps and servers</DialogDescription>
      </DialogHeader>

      <!-- Search Input -->
      <div class="flex h-14 items-center gap-3 border-b border-border px-4">
        <Search class="size-5 shrink-0 text-muted-foreground" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Search for MCP servers and tools"
          class="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50"
          @keydown="onInputKeydown"
        />
        <kbd
          v-if="!query"
          class="inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-accent text-sm text-muted-foreground/50 leading-none"
        >
          ESC
        </kbd>
      </div>

      <!-- Results Area -->
      <div ref="scrollRef" class="max-h-[420px] overflow-y-auto overscroll-contain">
        <!-- Loading -->
        <div v-if="loading && !results.length" class="px-4 py-10 flex flex-col items-center gap-3">
          <div class="flex gap-1.5">
            <div class="size-2 rounded-full bg-muted-foreground/30 animate-pulse" />
            <div class="size-2 rounded-full bg-muted-foreground/30 animate-pulse delay-75" />
            <div class="size-2 rounded-full bg-muted-foreground/30 animate-pulse delay-150" />
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="query.trim().length >= 2 && !hasResults"
          class="flex flex-col items-center gap-2 py-10"
        >
          <Package class="size-10 text-muted-foreground/20" />
          <p class="text-sm font-medium text-foreground/80">No results found for "{{ query }}"</p>
          <p class="text-xs text-muted-foreground/60">Try searching for a different app or capability</p>
        </div>

        <!-- Grouped results -->
        <template v-else-if="hasResults">
          <div v-for="(items, type) in groupedResults" :key="type" class="py-2">
            <div class="px-4 py-1.5">
              <span class="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                {{ groupLabel(type as string) }}
              </span>
            </div>
            <button
              v-for="item in items"
              :key="item.id"
              class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer"
              :class="results.indexOf(item) === selectedIndex
                ? 'bg-accent'
                : 'hover:bg-accent/50'"
              @click="selectResult(item)"
              @mouseenter="selectedIndex = results.indexOf(item)"
            >
              <!-- Icon -->
              <div class="size-10 rounded shadow-md shrink-0 flex items-center justify-center overflow-hidden border border-border bg-secondary">
                <img
                  v-if="item.icon_url"
                  :src="item.icon_url"
                  :alt="item.title"
                  class="size-full object-cover"
                />
                <img
                  v-else-if="item.cover_image_url"
                  :src="item.cover_image_url"
                  :alt="item.title"
                  class="size-full object-cover"
                />
                <span v-else class="text-sm font-bold text-muted-foreground/50 select-none">
                  {{ iconLetter(item.title) }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-foreground truncate">{{ item.title }}</span>
                  <span
                    v-if="item.seller?.is_verified"
                    class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider"
                  >
                    Verified
                  </span>
                </div>
                <p class="text-xs text-muted-foreground truncate mt-0.5">
                  {{ item.seller?.display_name }} • {{ item.short_description }}
                </p>
              </div>
            </button>
          </div>
        </template>
      </div>

      <!-- Footer hint -->
      <div class="flex items-center px-4 py-3 border-t border-border bg-muted/50">
        <div class="flex items-center gap-4 text-xs font-medium text-muted-foreground/60">
          <span class="flex items-center gap-1.5">
            <kbd class="px-1.5 rounded bg-accent border border-border text-[10px] text-muted-foreground">↑↓</kbd>
            Nav
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="px-1.5 rounded bg-accent border border-border text-[10px] text-muted-foreground">↵</kbd>
            Select
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="px-1.5 rounded bg-accent border border-border text-[10px] text-muted-foreground">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
