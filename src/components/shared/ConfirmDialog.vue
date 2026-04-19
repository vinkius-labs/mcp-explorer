<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('cancel')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="flex justify-end gap-3">
        <Button variant="outline" @click="emit('cancel')">Cancel</Button>
        <Button
          :variant="confirmVariant ?? 'default'"
          @click="emit('confirm')"
        >
          {{ confirmLabel ?? 'Confirm' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
