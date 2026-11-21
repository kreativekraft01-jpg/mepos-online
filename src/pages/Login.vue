<template>
  <div class="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
    <form class="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-6" @submit.prevent="onSubmit">
      <div class="flex items-center gap-3 mb-6">
        <div class="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
          <Lock :size="18" />
        </div>
        <div>
          <h1 class="text-xl font-semibold">{{ settings.storeName || 'MEPoS' }}</h1>
          <p class="text-xs text-muted-foreground">Admin login</p>
        </div>
      </div>

      <label class="block text-xs font-medium mb-1 text-muted-foreground">Username</label>
      <div class="relative mb-4">
        <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="username"
          class="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          autocomplete="username"
        />
      </div>

      <label class="block text-xs font-medium mb-1 text-muted-foreground">Password</label>
      <div class="relative mb-2">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="password"
          :type="show ? 'text' : 'password'"
          class="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          autocomplete="current-password"
        />
        <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" @click="show = !show">
          <EyeOff v-if="show" :size="16" />
          <Eye v-else :size="16" />
        </button>
      </div>

      <p v-if="error" class="text-sm text-destructive mb-3">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Loader2 v-if="loading" :size="16" class="animate-spin" />
        <LogIn v-else :size="16" />
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User, Eye, EyeOff, LogIn, Loader2 } from 'lucide-vue-next'
import { loginRequest } from '../store/authStore'
import { useStore } from '../store/useStore'

const router = useRouter()
const store = useStore()
const settings = store.settings

const username = ref('')
const password = ref('')
const show = ref(false)
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    error.value = 'Enter username and password'
    return
  }
  loading.value = true
  const res = await loginRequest(username.value.trim(), password.value)
  loading.value = false
  if (!res.ok) {
    error.value = res.error || 'Invalid credentials'
    return
  }
  router.replace('/')
}
</script>
