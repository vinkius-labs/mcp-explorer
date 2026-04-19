<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-vue-next'

const model = defineModel<Array<{ key: string; value: string }>>({ default: () => [] })

function addVar() {
  model.value.push({ key: '', value: '' })
}

function removeVar(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between pointer-events-auto">
      <Label class="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Environment Variables</Label>
      <Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground hover:bg-accent hover:text-foreground px-2" @click="addVar">
        <Plus class="h-3.5 w-3.5 mr-1" />
        Add
      </Button>
    </div>

    <div
      v-for="(envVar, index) in model"
      :key="index"
      class="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <Input
        v-model="envVar.key"
        placeholder="VARIABLE_NAME"
        class="flex-1 font-mono text-sm h-9 bg-accent/50 border-border focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Input
        v-model="envVar.value"
        placeholder="Unset"
        type="password"
        class="flex-1 font-mono text-sm h-9 bg-accent/50 border-border focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/30"
      />
      <Button
        variant="ghost"
        size="icon"
        class="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        @click="removeVar(index)"
      >
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
