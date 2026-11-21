<template>
  <div class="relative overflow-hidden touch-pan-y" ref="wrap">
    <div class="absolute inset-y-0 right-0 w-24 bg-destructive text-destructive-foreground flex items-center justify-center font-bold text-sm select-none">
      Delete
    </div>
    <div
      class="relative bg-card transition-transform duration-150 ease-out"
      :style="{ transform: `translateX(${offset}px)` }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onUp"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits<{ delete: [] }>()
const offset = ref(0)
let startX = 0
let startY = 0
let dragging = false
let locked: 'x' | 'y' | null = null

function onDown(e: PointerEvent) {
  if (e.button !== 0) return
  dragging = true
  locked = null
  startX = e.clientX
  startY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!locked) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  }
  if (locked === 'y') return
  e.preventDefault()
  const base = offset.value < -10 ? -96 : 0
  const next = base + dx
  offset.value = Math.min(0, Math.max(-120, next))
}
function onUp() {
  if (!dragging) return
  dragging = false
  if (offset.value < -70) {
    offset.value = 0
    emit('delete')
  } else if (offset.value < -30) {
    offset.value = -96
  } else {
    offset.value = 0
  }
}
</script>
