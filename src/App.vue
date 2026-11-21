<template>
  <router-view />
  <Toasts />
  <AiAssistant />
  <Toaster position="top-center" richColors />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import { initServerSync } from './utils/serverSync'
import Toasts from './components/Toasts.vue'
import AiAssistant from './components/AiAssistant.vue'

onMounted(() => {
  initServerSync()
})
</script>
