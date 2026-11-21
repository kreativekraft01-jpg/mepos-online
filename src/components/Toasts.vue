<template>
  <div class="toast-container">
    <div
      v-for="t in store.toasts"
      :key="t.id"
      :class="['toast', t.type]"
      @click="store.dismissToast(t.id)"
    >
      <span class="toast-icon">{{ icons[t.type] }}</span>
      <span>{{ t.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'
import { useStore } from '../store/useStore'

const store = useStore()
const icons: Record<string, string> = { success: '✓', error: '✕', info: 'i' }

const timers = new Map<string, ReturnType<typeof setTimeout>>()
watchEffect(() => {
  for (const t of store.toasts) {
    if (!timers.has(t.id)) {
      const timer = setTimeout(() => {
        timers.delete(t.id)
        store.dismissToast(t.id)
      }, 3200)
      timers.set(t.id, timer)
    }
  }
})
</script>
