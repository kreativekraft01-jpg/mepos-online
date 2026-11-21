<template>
  <router-view />
  <AiAssistant />
  <Toaster position="top-right" :theme="toasterTheme" rich-colors />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Toaster } from 'vue-sonner'
import { initServerSync } from './utils/serverSync'
import AiAssistant from './components/AiAssistant.vue'

const toasterTheme = ref<'dark' | 'light'>(
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'
)

let themeObserver: MutationObserver | null = null

onMounted(() => {
  initServerSync()
  if (!document.documentElement.classList.contains('light') && !document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.add('dark')
  }
  toasterTheme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  themeObserver = new MutationObserver(() => {
    toasterTheme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => themeObserver?.disconnect())
</script>
