<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Package, Settings, LogOut, Monitor, Plus, LayoutGrid, Circle,
  Landmark, Zap, Heart, Sparkles, Flame, DollarSign, Rocket,
  MessageSquare, TrendingUp, Brain, ShieldCheck, HeartHandshake,
  LayoutList, Code2, BrainCircuit, BarChart3, Server, Megaphone,
  Wallet, ShoppingCart, FileText, Handshake, Palette, Database,
  Workflow, MapPin, GraduationCap, Scale, HeartPulse, Plane,
  Building2, Building, Box,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

import { getDefaultProvider } from '@/mcp-providers/registry'
import type { CategoryGroup } from '@/mcp-providers/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()


const serverNav = [
  { to: '/servers/add', icon: Plus, label: 'Add MCP Server', exact: true },
  { to: '/servers', icon: Package, label: 'My MCP Servers', exact: true },
]

const systemNav = [
  { to: '/clients', icon: Monitor, label: 'AI Clients', exact: false },
  { to: '/settings', icon: Settings, label: 'Settings', exact: false },
]

// Categories from marketplace API
const categories = ref<CategoryGroup[]>([])

onMounted(async () => {
  try {
    const { marketplace } = getDefaultProvider()
    categories.value = await marketplace.fetchCategoryGroups()
  } catch {
    // Silently fail — sidebar still works
  }
})

const totalListings = computed(() => categories.value.reduce((sum, c) => sum + c.listing_count, 0))

/** Map API lucide_icon strings to actual components */
const lucideIconMap: Record<string, Component> = {
  Landmark, Zap, Heart, Sparkles, Flame, DollarSign, Rocket,
  MessageSquare, TrendingUp, Brain, ShieldCheck, HeartHandshake,
  LayoutList, Code2, BrainCircuit, BarChart3, Server, Megaphone,
  Wallet, ShoppingCart, FileText, Handshake, Palette, Database,
  Workflow, MapPin, GraduationCap, Scale, HeartPulse, Plane,
  Building2, Building, LayoutGrid, Box, Circle,
}

function getCategoryIcon(name?: string | null): Component {
  if (!name) return Circle
  return lucideIconMap[name] ?? Circle
}

function isActive(path: string, exact: boolean = false): boolean {
  if (exact) {
    return route.path === path
  }
  return route.path.startsWith(path)
}

function isCategoryActive(slug: string): boolean {
  return route.path === '/dashboard' && route.query.category === slug
}

function isListingActive(): boolean {
  return route.path === '/dashboard' && !route.query.category
}

function navigateCategory(slug: string) {
  router.push({ path: '/dashboard', query: { category: slug } })
}

function navigateListing() {
  router.push({ path: '/dashboard' })
}

async function handleLogout() {
  await auth.logout()
  router.replace('/dashboard')
}
</script>

<template>
  <aside class="flex w-[220px] shrink-0 flex-col bg-sidebar rounded-xl overflow-hidden py-2">

    <!-- Registry Section (absorbs remaining height) -->
    <div class="mt-4 px-4 flex flex-col min-h-0 flex-1">

      <nav class="flex flex-col gap-0.5 -mx-2 min-h-0 flex-1">
        <!-- Listing (main marketplace) -->
        <button
          class="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-colors w-full text-left"
          :class="isListingActive() ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'"
          @click="navigateListing"
        >
          <span class="truncate">Discover MCP Servers</span>
          <span v-if="totalListings" class="text-[11px] text-muted-foreground/50 font-mono tabular-nums shrink-0">{{ totalListings }}</span>
        </button>

        <!-- Category links (fills remaining space, scrolls) -->
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
          <button
            v-for="cat in categories"
            :key="cat.slug"
            class="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-colors w-full text-left shrink-0"
            :class="isCategoryActive(cat.slug) ? 'bg-surface-active text-foreground' : 'text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover'"
            @click="navigateCategory(cat.slug)"
          >
            <span class="flex items-center gap-2 truncate">
              <component :is="getCategoryIcon(cat.lucide_icon)" class="h-3.5 w-3.5 shrink-0 opacity-50" />
              <span class="truncate">{{ cat.label }}</span>
            </span>
          </button>
        </div>
      </nav>
    </div>

    <div class="h-px bg-border my-3 mx-4" />

    <!-- Bottom Navigation (pinned) -->
    <nav class="flex flex-col gap-0.5 px-2 shrink-0">
      <router-link
        v-for="item in serverNav"
        :key="item.to"
        :to="item.to"
        class="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="
          isActive(item.to, item.exact)
            ? 'bg-surface-active text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
        "
      >
        <span class="flex items-center gap-3">
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
        </span>
      </router-link>

      <!-- Separator -->
      <div class="h-px bg-border my-3 mx-2" />

      <router-link
        v-for="item in systemNav"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="
          isActive(item.to, item.exact)
            ? 'bg-surface-active text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
        "
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        {{ item.label }}
      </router-link>
    </nav>



    <!-- User section -->
    <div class="px-2 py-2 shrink-0">
      <div v-if="auth.authenticated" class="flex items-center justify-between rounded-lg px-2 py-1.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold"
          >
            {{ auth.userInitials }}
          </div>
          <span class="truncate text-xs font-medium text-foreground">
            {{ auth.user?.name ?? 'Account' }}
          </span>
        </div>
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                @click="handleLogout"
              >
                <LogOut class="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4">
              Logout
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div v-else class="px-1 mt-4">
        <button
          @click="auth.showLoginModal = true"
          class="flex w-full items-center justify-center rounded-lg bg-surface-active px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Sign in to Cloud
        </button>
      </div>
    </div>
  </aside>
</template>
