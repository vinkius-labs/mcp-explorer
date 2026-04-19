<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { PromptExample } from '@/mcp-providers/types'

const props = defineProps<{
  examples: PromptExample[]
  integrationName?: string
}>()

// ── State ─────────────────────────────────────────────────────────
interface ConversationEntry {
  prompt: string
  response: string
  formattedResponse: string
  typedPrompt: string
  showResponse: boolean
  doneTyping: boolean
}

const conversation = ref<ConversationEntry[]>([])
const currentIndex = ref(0)
const isTyping = ref(false)
const chatArea = ref<HTMLElement | null>(null)

let typeTimer: ReturnType<typeof setTimeout> | null = null
let cycleTimer: ReturnType<typeof setTimeout> | null = null

// ── Formatted response (markdown → HTML) ──────────────────────────
function formatResponse(text: string): string {
  let t = text.replace(/<[^>]+>/g, '')

  // Code blocks (``` ... ```)
  t = t.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_m, _lang, code) =>
      `<pre class="my-2 p-3 rounded-lg bg-accent overflow-x-auto"><code class="text-xs font-mono text-muted-foreground whitespace-pre">${code.trim()}</code></pre>`,
  )

  // Headings
  t = t.replace(/^#### (.+)$/gm, '<h4 class="text-sm font-bold mt-3 mb-1 text-foreground/90">$1</h4>')
  t = t.replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1 text-foreground/90">$1</h3>')
  t = t.replace(/^## (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1 text-foreground/90">$1</h3>')
  t = t.replace(/^# (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-1 text-foreground/90">$1</h3>')

  // Blockquotes
  t = t.replace(
    /^> (.+)$/gm,
    '<blockquote class="border-l-2 border-border pl-3 my-2 italic text-muted-foreground/50">$1</blockquote>',
  )

  // Horizontal rule
  t = t.replace(/^---$/gm, '<hr class="my-3 border-border" />')

  // Bold
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground/90">$1</strong>')

  // Italic
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Inline code
  t = t.replace(
    /`([^`]+)`/g,
    '<code class="text-foreground/70 font-mono text-xs bg-accent px-1.5 py-0.5 rounded">$1</code>',
  )

  // Links [text](url)
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:no-underline">$1</a>',
  )

  // Numbered lists
  t = t.replace(
    /^\d+\. (.+)$/gm,
    '<li class="pl-1">$1</li>',
  )
  t = t.replace(
    /(<li class="pl-1">.*<\/li>\n?)+/g,
    (m) => `<ol class="space-y-1 my-2 ml-4 list-decimal">${m}</ol>`,
  )

  // Bullet lists
  t = t.replace(
    /^- (.+)$/gm,
    '<li class="pl-1">$1</li>',
  )
  t = t.replace(
    /(<li class="pl-1">.*<\/li>\n?)+/g,
    (m) => `<ul class="space-y-1 my-2 ml-4 list-disc">${m}</ul>`,
  )

  // Markdown tables
  t = t.replace(
    /((?:^\|.+\|$\n?)+)/gm,
    (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim())
      if (rows.length < 2) return tableBlock
      let html = '<table class="w-full my-2 text-xs border-collapse">'
      rows.forEach((row, i) => {
        if (/^\|[\s-:|]+\|$/.test(row)) return
        const cells = row.split('|').filter(c => c !== '').map(c => c.trim())
        if (i === 0) {
          html += '<thead><tr>'
          cells.forEach(c => { html += `<th class="text-left py-1.5 px-2 font-semibold border-b border-border text-foreground/80">${c}</th>` })
          html += '</tr></thead><tbody>'
        } else {
          html += '<tr>'
          cells.forEach(c => { html += `<td class="py-1 px-2 border-b border-border/50">${c}</td>` })
          html += '</tr>'
        }
      })
      html += '</tbody></table>'
      return html
    },
  )

  // Line breaks
  t = t.replace(/\n/g, '<br/>')

  // Clean up
  t = t.replace(/<\/li>\s*(<br\s*\/?>)+\s*<li/g, '</li><li')
  t = t.replace(/<ul([^>]*)>\s*(<br\s*\/?>)+/g, '<ul$1>')
  t = t.replace(/<ol([^>]*)>\s*(<br\s*\/?>)+/g, '<ol$1>')
  t = t.replace(/(<br\s*\/?>)+\s*<\/ul>/g, '</ul>')
  t = t.replace(/(<br\s*\/?>)+\s*<\/ol>/g, '</ol>')

  return t
}

// ── Scroll to bottom ──────────────────────────────────────────────
function scrollToBottom() {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTo({
        top: chatArea.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  })
}

// ── Typewriter engine ─────────────────────────────────────────────
function clearTimers() {
  if (typeTimer) { clearTimeout(typeTimer); typeTimer = null }
  if (cycleTimer) { clearTimeout(cycleTimer); cycleTimer = null }
}

function typeChar(entryIdx: number, full: string, pos: number) {
  const entry = conversation.value[entryIdx]
  if (!entry) return

  if (pos >= full.length) {
    entry.doneTyping = true
    isTyping.value = false
    // Show response after typing
    setTimeout(() => {
      entry.showResponse = true
      scrollToBottom()
      // After 3s, start the next prompt
      cycleTimer = setTimeout(() => {
        startNextPrompt()
      }, 3000)
    }, 400)
    return
  }
  entry.typedPrompt = full.slice(0, pos + 1)
  if (pos % 5 === 0) scrollToBottom()
  const delay = full[pos] === ' ' ? 25 : Math.random() * 30 + 18
  typeTimer = setTimeout(() => typeChar(entryIdx, full, pos + 1), delay)
}

function startNextPrompt() {
  if (!props.examples.length) return

  // Circular queue: trim oldest entry when we exceed the total examples count
  if (conversation.value.length >= props.examples.length) {
    conversation.value.shift()
  }

  const example = props.examples[currentIndex.value]

  const entry: ConversationEntry = {
    prompt: example.prompt,
    response: example.response,
    formattedResponse: formatResponse(example.response),
    typedPrompt: '',
    showResponse: false,
    doneTyping: false,
  }

  conversation.value.push(entry)
  const entryIdx = conversation.value.length - 1
  isTyping.value = true
  scrollToBottom()

  // Advance index for next cycle
  currentIndex.value = (currentIndex.value + 1) % props.examples.length

  typeTimer = setTimeout(() => {
    typeChar(entryIdx, example.prompt, 0)
  }, 500)
}

onMounted(() => startNextPrompt())
onUnmounted(() => clearTimers())
</script>

<template>
  <div
    class="relative rounded-xl border border-border overflow-hidden bg-card flex flex-col h-[516px] max-h-[516px]"
  >
    <!-- Header bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-mono font-medium text-muted-foreground/50 uppercase tracking-wide">AI Agent</span>
        <span class="text-xs text-muted-foreground/20">→</span>
        <span class="text-xs font-mono font-semibold text-foreground/70 uppercase tracking-wide">Vinkius AI Gateway</span>
      </div>
    </div>

    <!-- Chat feed — scrolling conversation -->
    <div
      ref="chatArea"
      class="flex-1 overflow-y-auto px-5 py-5 space-y-4 h-[445px] max-h-[445px]"
    >
      <template v-for="(entry, i) in conversation" :key="i">
        <!-- User prompt -->
        <div class="flex items-start gap-2.5">
          <div
            class="size-6 rounded-md bg-accent/50 border border-border flex items-center justify-center shrink-0 mt-0.5"
          >
            <svg class="size-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-medium text-muted-foreground/50 block mb-1">You</span>
            <p class="text-sm text-foreground/80 leading-relaxed">
              <span>{{ entry.typedPrompt }}</span>
              <span
                v-if="!entry.doneTyping"
                class="inline-block w-[2px] h-[15px] bg-foreground rounded-full ml-0.5 align-middle animate-pulse"
              />
            </p>
          </div>
        </div>

        <!-- Assistant response -->
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-1.5"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="entry.showResponse" class="flex items-start gap-2.5">
            <div
              class="size-6 rounded-md bg-accent/50 border border-border flex items-center justify-center shrink-0 mt-0.5"
            >
              <svg class="size-3.5 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <span class="text-xs font-medium text-muted-foreground/50 block mb-1">AI Agent</span>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                class="text-sm text-muted-foreground leading-relaxed [&_strong]:font-semibold [&_strong]:text-foreground/80"
                v-html="entry.formattedResponse"
              />
            </div>
          </div>
        </Transition>

        <!-- Divider between entries -->
        <div v-if="entry.showResponse && i < conversation.length - 1" class="h-px bg-border my-1" />
      </template>
    </div>

    <!-- Trust footer -->
    <div class="flex items-center gap-3 px-4 py-2 border-t border-border bg-background shrink-0">
      <div class="flex items-center gap-2.5 text-xs pt-1">
        <span class="font-mono uppercase tracking-widest text-muted-foreground/40">High Security</span>
        <span class="text-muted-foreground/10">·</span>
        <span class="font-mono uppercase tracking-widest text-muted-foreground/40">Kill Switch</span>
        <span class="text-muted-foreground/10">·</span>
        <span class="font-mono uppercase tracking-widest text-muted-foreground/40">Plug and Play</span>
      </div>
    </div>
  </div>
</template>
