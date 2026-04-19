<script setup lang="ts">
import type { CategoryGroup } from '@/mcp-providers/types'

const props = defineProps<{
  categories: CategoryGroup[]
  selected: string | null
}>()

const emit = defineEmits<{
  select: [slug: string | null]
}>()

/** Icon map — category slug → lucide icon type (matching Site's CATEGORY_ICONS) */
const CATEGORY_ICONS: Record<string, string> = {
  'industry-titans': 'landmark',
  superpower: 'zap',
  'loved-by-devs': 'code',
  'ai-frontier': 'brain',
  'the-unthinkable': 'zap',
  'money-moves': 'briefcase',
  'ship-it': 'cloud',
  'talk-to-me': 'globe',
  'growth-engine': 'briefcase',
  'brain-trust': 'brain',
  'fort-knox': 'cloud',
  'mcp-friends': 'hearthandshake',
  productivity: 'zap',
  'developer-tools': 'code',
  ai: 'brain',
  'data-intelligence': 'brain',
  infrastructure: 'cloud',
  security: 'cloud',
  communication: 'globe',
  marketing: 'briefcase',
  finance: 'briefcase',
  ecommerce: 'briefcase',
  content: 'globe',
  'crm-sales': 'briefcase',
  design: 'globe',
  databases: 'code',
  automation: 'code',
  maps: 'globe',
  education: 'globe',
  legal: 'briefcase',
  healthcare: 'zap',
  travel: 'globe',
  'real-estate': 'briefcase',
  enterprise: 'briefcase',
}

function getIconType(group: CategoryGroup): string {
  return CATEGORY_ICONS[group.slug] ?? group.lucide_icon ?? 'grid'
}

function handleClick(slug: string) {
  emit('select', props.selected === slug ? null : slug)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- "All" pill -->
    <button
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap cursor-pointer transition-all"
      :class="
        !selected
          ? 'bg-white text-black border-white'
          : 'bg-transparent text-white/50 border-white/[0.12] hover:border-white/30 hover:text-white/80'
      "
      @click="emit('select', null)"
    >
      All
    </button>

    <!-- Category pills -->
    <button
      v-for="group in categories"
      :key="group.slug"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap cursor-pointer transition-all"
      :class="
        selected === group.slug
          ? 'bg-white text-black border-white'
          : 'bg-transparent text-white/50 border-white/[0.12] hover:border-white/30 hover:text-white/80'
      "
      @click="handleClick(group.slug)"
    >
      <!-- Category icon (inline SVG — matching Site) -->
      <svg
        class="h-3 w-3 opacity-80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <!-- code -->
        <template v-if="getIconType(group) === 'code'">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </template>
        <!-- brain -->
        <template v-else-if="getIconType(group) === 'brain'">
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        </template>
        <!-- zap -->
        <template v-else-if="getIconType(group) === 'zap'">
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </template>
        <!-- cloud -->
        <template v-else-if="getIconType(group) === 'cloud'">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </template>
        <!-- briefcase -->
        <template v-else-if="getIconType(group) === 'briefcase'">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" />
        </template>
        <!-- globe -->
        <template v-else-if="getIconType(group) === 'globe'">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
        </template>
        <!-- landmark -->
        <template v-else-if="getIconType(group) === 'landmark'">
          <path d="M3 22h18" /><path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M12 2l8 5H4z" />
        </template>
        <!-- hearthandshake -->
        <template v-else-if="getIconType(group) === 'hearthandshake'">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
          <path d="m18 15-2-2" /><path d="m15 18-2-2" />
        </template>
        <!-- default grid -->
        <template v-else>
          <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
        </template>
      </svg>

      {{ group.label }}

      <span v-if="group.listing_count > 0" class="opacity-50 font-mono text-[11px]">
        {{ group.listing_count }}
      </span>
    </button>
  </div>
</template>
