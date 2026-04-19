<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServersStore } from '@/stores/servers'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import ServerForm from '@/components/servers/ServerForm.vue'
import ServerCapabilities from '@/components/servers/ServerCapabilities.vue'
import { useMcpIntrospection } from '@/composables/useMcpIntrospection'
import {
  CheckCircle2, AlertTriangle, Terminal, Globe,
} from 'lucide-vue-next'
import type { InstallResult } from '@/types'

const route = useRoute()
const router = useRouter()
const serversStore = useServersStore()
const formRef = ref<InstanceType<typeof ServerForm> | null>(null)

// Mode detection
const isExistingServer = computed(() => Boolean(route.params.name))
const serverNameParam = computed(() => String(route.params.name || ''))
const server = computed(() => isExistingServer.value ? serversStore.getServer(serverNameParam.value) : null)

// View/Edit toggle (existing servers start in detail mode)
const editing = ref(false)

// Action state
const saving = ref(false)
const results = ref<InstallResult[]>([])
const done = ref(false)

// Delete state
const deleting = ref(false)
const showDeleteDialog = ref(false)

// Introspection (detail mode: inline, form mode: modal)
const introspection = useMcpIntrospection()
const showTestModal = ref(false)
const testValidationMsg = ref<string | null>(null)

// Auto-introspect once when entering detail mode for existing server
watch([server, editing], ([s, ed]) => {
  if (s && !ed && !introspection.result.value && !introspection.loading.value && !introspection.error.value) {
    introspection.introspect({
      transport: s.transport,
      command: s.command,
      args: s.args,
      url: s.url,
      env: s.env,
    })
  }
}, { immediate: true })

function handleRetryIntrospection() {
  if (!server.value) return
  introspection.introspect({
    transport: server.value.transport,
    command: server.value.command,
    args: server.value.args,
    url: server.value.url,
    env: server.value.env,
  })
}

function handleTestConnection() {
  if (!formRef.value) return
  const config = formRef.value.getServerConfig()

  // Validate: need at least connection data to test
  const hasConnection = config.transport === 'http'
    ? !!config.url.trim()
    : !!config.command.trim()

  if (!hasConnection) {
    testValidationMsg.value = config.transport === 'http'
      ? 'Enter a server URL before testing.'
      : 'Enter a command before testing.'
    showTestModal.value = true
    return
  }

  testValidationMsg.value = null
  showTestModal.value = true
  introspection.introspect({
    transport: config.transport,
    command: config.command,
    args: config.args,
    url: config.url,
    env: config.env,
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  saving.value = true

  try {
    const config = formRef.value.getServerConfig()
    const currentClients = formRef.value.selectedClients

    if (isExistingServer.value && server.value) {
      // Remove from clients that were unchecked
      const removedClients = server.value.installedIn.filter((cid: string) => !currentClients.includes(cid))
      if (removedClients.length > 0) {
        await serversStore.removeServer(serverNameParam.value, removedClients)
      }
    }

    if (currentClients.length > 0) {
      results.value = await serversStore.installServer(config, currentClients)
    }

    done.value = true
  } catch {
    // Handled by store
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!server.value) return
  deleting.value = true
  try {
    await serversStore.removeServer(server.value.name, server.value.installedIn)
    showDeleteDialog.value = false
    router.push('/servers')
  } catch {
    // Handled by store
  } finally {
    deleting.value = false
  }
}

function enterEditMode() {
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  introspection.reset()
  // Re-introspect after cancel since we cleared state
  if (server.value) {
    introspection.introspect({
      transport: server.value.transport,
      command: server.value.command,
      args: server.value.args,
      url: server.value.url,
      env: server.value.env,
    })
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header — compact, single line -->
    <div class="flex-none px-6 py-3 shrink-0 bg-background flex items-baseline justify-between gap-4">
      <h1 class="text-xl font-bold tracking-tight text-foreground leading-normal truncate">
        {{ isExistingServer ? (server?.name || 'MCP Server') : 'Add MCP Server' }}
      </h1>
      <p class="text-muted-foreground text-sm shrink-0">
        {{ isExistingServer
          ? (editing ? 'Editing MCP server configuration.' : 'MCP server details and capabilities.')
          : 'Register an MCP server to your AI clients.'
        }}
      </p>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-2">
      <div>

        <!-- Not found -->
        <template v-if="isExistingServer && !server && !done">
          <div class="pt-8 text-center text-muted-foreground">
            <h2 class="text-xl font-semibold text-foreground mb-2">Server missing</h2>
            <p class="text-sm">We could not locate this provider in your registry.</p>
          </div>
        </template>

        <!-- Success State -->
        <template v-else-if="done">
          <div class="max-w-md mx-auto pt-12 space-y-4 text-center">
            <div class="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 class="h-6 w-6 text-primary" />
            </div>
            <h2 class="text-xl font-bold text-foreground">
              {{ isExistingServer ? 'Updated' : 'Installed' }} {{ formRef?.serverName }}
            </h2>
            <p class="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              {{ isExistingServer
                ? 'The MCP server configuration has been rewritten to your AI clients.'
                : 'The MCP server configuration has been saved to your selected AI clients.'
              }}
            </p>

            <div v-if="results.length > 0" class="bg-muted/50 rounded-lg p-4 text-left space-y-2 mb-6 border border-border">
              <div
                v-for="result in results"
                :key="result.client_id"
                class="flex items-center gap-3 text-sm"
              >
                <CheckCircle2 v-if="result.success" class="h-4 w-4 text-emerald-500 shrink-0" />
                <AlertTriangle v-else class="h-4 w-4 text-destructive shrink-0" />
                <span class="font-medium text-foreground">{{ result.client_id }}</span>
                <span class="text-muted-foreground/60" v-if="result.success && result.restart_required">
                  — restart to apply
                </span>
                <span class="text-destructive/80" v-if="!result.success">
                  — {{ result.error }}
                </span>
              </div>
            </div>

            <Button class="w-full h-11 font-semibold" @click="router.push('/servers')">
              {{ isExistingServer ? 'Back to Installed MCP Servers' : 'View Installed MCP Servers' }}
            </Button>
          </div>
        </template>

        <!-- Detail Mode (read-only, existing server) -->
        <template v-else-if="isExistingServer && !editing && server">
          <div class="space-y-5 pb-8">

            <!-- Connection info -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Connection</Label>
                <span class="inline-flex items-center gap-1.5 text-sm font-medium" :class="server.transport === 'http' ? 'text-blue-500 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'">
                  <Terminal v-if="server.transport === 'stdio'" class="w-3.5 h-3.5" />
                  <Globe v-else class="w-3.5 h-3.5" />
                  {{ server.transport === 'http' ? 'Streamable HTTP' : 'stdio' }}
                </span>
              </div>
              <p class="text-sm font-mono text-foreground/80 break-all">
                {{ server.transport === 'http' ? server.url : [server.command, ...server.args].join(' ') }}
              </p>
            </div>

            <!-- Environment Variables (if any) -->
            <div v-if="Object.keys(server.env || {}).length > 0" class="space-y-1.5">
              <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Environment Variables</Label>
              <div
                v-for="(_, key) in server.env"
                :key="String(key)"
                class="flex items-center gap-2 text-xs font-mono"
              >
                <span class="text-foreground/80">{{ key }}</span>
                <span class="text-muted-foreground/30">=</span>
                <span class="text-muted-foreground/50">••••••••</span>
              </div>
            </div>

            <!-- Installed Clients -->
            <div class="space-y-1.5">
              <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Installed In</Label>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="cid in server.installedIn"
                  :key="cid"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                >
                  {{ cid }}
                </span>
              </div>
            </div>

            <Separator class="bg-border" />

            <!-- Capabilities (auto-loaded) -->
            <div class="space-y-2">
              <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Capabilities</Label>
              <ServerCapabilities
                :result="introspection.result.value"
                :loading="introspection.loading.value"
                :error="introspection.error.value"
                @retry="handleRetryIntrospection"
              />
            </div>
          </div>
        </template>

        <!-- Form Mode (add new or editing existing) -->
        <template v-else>
          <div class="pb-4">
            <ServerForm ref="formRef" :initial-data="server ?? undefined" />
          </div>
        </template>
      </div>
    </div>

    <!-- Sticky Footer: Detail Mode -->
    <div v-if="isExistingServer && !editing && server && !done" class="flex-none px-6 py-3 bg-background/80 backdrop-blur-md border-t border-border flex items-center shrink-0">
      <div class="w-full flex items-center justify-between">
        <Dialog v-model:open="showDeleteDialog">
          <DialogTrigger as-child>
            <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10">
              Delete MCP Server
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px] bg-popover border-border">
            <DialogHeader>
              <DialogTitle class="text-foreground">Delete MCP Server</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong class="text-foreground">"{{ server.name }}"</strong>? This will permanently remove it from all your AI clients and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter class="mt-6 gap-2 sm:gap-0 sm:space-x-3">
              <Button variant="outline" @click="showDeleteDialog = false" :disabled="deleting">
                Cancel
              </Button>
              <Button variant="destructive" @click="handleDelete" :disabled="deleting">
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button size="sm" @click="enterEditMode">
          Edit MCP Server
        </Button>
      </div>
    </div>

    <!-- Sticky Footer: Form Mode (editing existing) -->
    <div v-if="isExistingServer && editing && !done" class="flex-none px-6 py-3 bg-background/80 backdrop-blur-md border-t border-border flex items-center shrink-0">
      <div class="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" @click="handleTestConnection" :disabled="saving" class="text-muted-foreground">
          Test
        </Button>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" @click="cancelEdit" :disabled="saving" class="text-muted-foreground">
            Cancel
          </Button>
          <Button size="sm" :disabled="!formRef?.isValid || saving" @click="handleSubmit">
            Save Changes
          </Button>
        </div>
      </div>
    </div>

    <!-- Sticky Footer: Add new server -->
    <div v-if="!isExistingServer && !done" class="flex-none px-6 py-3 bg-background/80 backdrop-blur-md border-t border-border flex items-center shrink-0">
      <div class="w-full flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="ghost" size="sm" class="text-muted-foreground">
                How it works
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-md bg-popover border-border text-foreground">
              <DialogHeader>
                <DialogTitle class="text-xl">How does this work?</DialogTitle>
                <DialogDescription class="text-sm text-muted-foreground pt-4 space-y-4">
                  <p>When you add an MCP Server, Vinkius doesn't install any heavy binaries on your machine.</p>
                  <p>Instead, we automatically configure the selected AI coding environments (like Claude Code, Cursor, or VS Code) by injecting the proper routing configuration.</p>
                  <p>This allows your local code editors to securely discover and communicate with your custom tools using the standard MCP protocol.</p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" @click="handleTestConnection" :disabled="saving" class="text-muted-foreground">
            Test
          </Button>
        </div>

        <Button size="sm" :disabled="!formRef?.isValid || saving" @click="handleSubmit">
          Add to AI Clients
        </Button>
      </div>
    </div>

    <!-- Test Connection Modal (for add/edit form mode) -->
    <Dialog v-model:open="showTestModal">
      <DialogContent class="sm:max-w-lg bg-popover border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="text-foreground">Test Connection</DialogTitle>
          <DialogDescription>
            Introspecting server capabilities via MCP protocol.
          </DialogDescription>
        </DialogHeader>
        <div class="mt-4">
          <p v-if="testValidationMsg" class="text-sm text-muted-foreground">
            {{ testValidationMsg }}
          </p>
          <ServerCapabilities
            v-else
            :result="introspection.result.value"
            :loading="introspection.loading.value"
            :error="introspection.error.value"
            @retry="handleTestConnection"
          />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
