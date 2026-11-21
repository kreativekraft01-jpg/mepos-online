<template>
  <div v-if="open" class="modal-overlay" @mousedown.self="onClose">
    <div :class="['modal', { wide }]" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="btn-icon btn-ghost" @click="onClose" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-body"><slot /></div>
      <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()

function onClose() {
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') onClose()
}

let prevOverflow = ''
watch(() => props.open, (v) => {
  if (v) {
    prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
  } else {
    document.body.style.overflow = prevOverflow
    window.removeEventListener('keydown', onKey)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = prevOverflow
  window.removeEventListener('keydown', onKey)
})
</script>
