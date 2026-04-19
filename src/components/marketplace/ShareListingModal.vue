<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        @click.self="$emit('update:open', false)"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="$emit('update:open', false)" />

        <!-- Panel -->
        <div class="relative z-10 w-full max-w-md rounded-xl border border-white/[0.08] bg-black shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between p-5 pb-0">
            <h2 class="text-lg font-bold text-white">
              Share with your network
            </h2>
            <button
              class="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              @click="$emit('update:open', false)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Description -->
          <p class="px-5 pt-2 text-sm text-white/40">
            Vinkius connects your AI Agents to
            <span class="font-semibold text-white">{{ title }}</span> — plug-and-play MCP server, one click.
          </p>

          <!-- Social buttons grid -->
          <div class="grid grid-cols-2 gap-2.5 p-5">
            <button
              v-for="platform in platforms"
              :key="platform.key"
              class="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-white/[0.08] hover:border-white/20 transition-all duration-200 hover:shadow-md cursor-pointer text-left"
              @click="handlePlatformClick(platform)"
            >
              <div
                class="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                :style="{ backgroundColor: platform.bgColor }"
              >
                <!-- eslint-disable-next-line vue/no-v-html -->
                <span class="flex items-center justify-center w-4 h-4 text-white" v-html="platform.svgIcon" />
              </div>
              <div class="min-w-0">
                <span class="text-sm font-medium text-white">{{ platform.label }}</span>
                <span v-if="(platform as any).copyFirst" class="block text-sm text-white/30 leading-tight">
                  Copies link first
                </span>
              </div>
            </button>
          </div>

          <!-- Copy link -->
          <div class="flex items-center gap-2 px-5 pb-5">
            <div class="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] overflow-hidden">
              <!-- Link icon -->
              <svg class="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span class="text-sm text-white/40 truncate select-all">{{ listingUrl }}</span>
            </div>
            <button
              class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer"
              :class="copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-transparent border-white/[0.08] text-white hover:bg-white/[0.06]'"
              @click="copyLink"
            >
              <!-- Check icon when copied -->
              <svg v-if="copied" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
              <!-- Link icon default -->
              <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  shortDescription?: string
  listingUrl: string
}>()

defineEmits<{ 'update:open': [value: boolean] }>()

const copied = ref(false)

const shareText = computed(() => {
  const text = `Connect your AI Agents to ${props.title} with one click — plug-and-play MCP server on Vinkius`
  return text.length > 230 ? text.slice(0, 227) + '...' : text
})

const hnText = computed(() => {
  const text = `${props.title} MCP Server`
  return text.length > 75 ? text.slice(0, 72) + '...' : text
})

const safeTitle = computed(() => {
  return props.title.length > 55 ? props.title.slice(0, 52) + '...' : props.title
})

const encodedUrl = computed(() => encodeURIComponent(props.listingUrl))
const encodedText = computed(() => encodeURIComponent(shareText.value))
const encodedHnText = computed(() => encodeURIComponent(hnText.value))
const encodedTitle = computed(() => encodeURIComponent(safeTitle.value))

const ICONS = {
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
}

const platforms = computed(() => [
  { key: 'x', label: 'X (Twitter)', svgIcon: ICONS.twitter, bgColor: '#000000', href: `https://x.com/intent/tweet?text=${encodedText.value}&url=${encodedUrl.value}` },
  { key: 'linkedin', label: 'LinkedIn', svgIcon: ICONS.linkedin, bgColor: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl.value}` },
  { key: 'producthunt', label: 'Product Hunt', svgIcon: ICONS.rocket, bgColor: '#DA552F', href: `https://www.producthunt.com/posts/new?url=${encodedUrl.value}&name=${encodedTitle.value}` },
  { key: 'reddit', label: 'Reddit', svgIcon: ICONS.message, bgColor: '#FF4500', href: `https://www.reddit.com/submit?url=${encodedUrl.value}&title=${encodedText.value}` },
  { key: 'hackernews', label: 'Hacker News', svgIcon: ICONS.arrowUp, bgColor: '#FF6600', href: `https://news.ycombinator.com/submitlink?u=${encodedUrl.value}&t=${encodedHnText.value}` },
  { key: 'discord', label: 'Discord', svgIcon: ICONS.message, bgColor: '#5865F2', href: 'https://discord.com/app' },
  { key: 'whatsapp', label: 'WhatsApp', svgIcon: ICONS.send, bgColor: '#25D366', href: `https://wa.me/?text=${encodedText.value}%20${encodedUrl.value}` },
  { key: 'telegram', label: 'Telegram', svgIcon: ICONS.send, bgColor: '#26A5E4', href: `https://t.me/share/url?url=${encodedUrl.value}&text=${encodedText.value}` },
  { key: 'facebook', label: 'Facebook', svgIcon: ICONS.globe, bgColor: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}` },
  { key: 'email', label: 'Email', svgIcon: ICONS.mail, bgColor: '#333333', href: `mailto:?subject=${encodeURIComponent(props.title)}&body=${encodedText.value}%0A%0A${encodedUrl.value}` },
])

async function handlePlatformClick(platform: { href: string; copyFirst?: boolean }) {
  if (platform.copyFirst) {
    const text = `${shareText.value}\n${props.listingUrl}`
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  }
  window.open(platform.href, '_blank', 'noopener,noreferrer')
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.listingUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = props.listingUrl
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
