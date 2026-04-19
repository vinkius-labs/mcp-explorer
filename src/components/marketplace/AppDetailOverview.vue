<script setup lang="ts">
import { Label } from '@/components/ui/label'
import type { ListingDetail } from '@/mcp-providers/types'

defineProps<{
  listing: ListingDetail
  askAiUrls: {
    chatgpt: string
    claude: string
    perplexity: string
  }
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Section header -->
    <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
      Ask AI about this MCP Server
    </Label>

    <!-- AI links -->
    <div class="flex flex-wrap gap-2">
      <a
        :href="askAiUrls.chatgpt"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-foreground/80 border border-border transition-all duration-200 hover:text-foreground hover:border-foreground/30 no-underline group"
      >
        <svg class="w-3.5 h-3.5 text-[#10a37f] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
        Open in ChatGPT
      </a>
      <a
        :href="askAiUrls.claude"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-foreground/80 border border-border transition-all duration-200 hover:text-foreground hover:border-foreground/30 no-underline group"
      >
        <svg class="w-3.5 h-3.5 text-[#d97706] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M4.709 15.955l4.72-10.496a.79.79 0 0 1 1.45-.003l4.725 10.502a.25.25 0 0 1-.335.327l-5.1-2.27a.25.25 0 0 0-.203 0l-5.1 2.27a.25.25 0 0 1-.336-.327l.18-.003zm8.837 1.98l-1.369-.608a.25.25 0 0 0-.203 0l-1.369.608a.25.25 0 0 0 .003.454l1.37.575a.25.25 0 0 0 .195 0l1.37-.575a.25.25 0 0 0 .003-.454z"/></svg>
        Open in Claude
      </a>
      <a
        :href="askAiUrls.perplexity"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-foreground/80 border border-border transition-all duration-200 hover:text-foreground hover:border-foreground/30 no-underline group"
      >
        <svg class="w-3.5 h-3.5 text-[#20808d] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L5 5.5V12l7 4 7-4V5.5L12 1zm0 2.311l4.846 3.128L12 9.567 7.154 6.439 12 3.311zM6 7.654l5 3.228v6.464l-5-3.228V7.654zm12 0v6.464l-5 3.228v-6.464l5-3.228z"/></svg>
        Open in Perplexity
      </a>
    </div>

    <!-- Gateway note -->
    <p class="text-xs text-muted-foreground/60 tracking-wide">
      Vinkius AI Gateway supports Streamable HTTP and SSE.
    </p>
  </div>
</template>
