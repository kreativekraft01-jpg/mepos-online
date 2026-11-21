<template>
  <div class="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-4xl font-black italic tracking-tighter mb-2">ME<span class="text-primary">PoS</span></div>
        <div class="text-sm text-muted-foreground">{{ settings.storeName || 'MEPoS' }} — {{ settings.tagline || 'Buy · Sell · Exchange refurbished tech' }}</div>
      </div>

      <form @submit.prevent="onSubmit" class="bg-card border border-border p-8 rounded-sm shadow-2xl space-y-5">
        <div class="text-center">
          <div class="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock class="w-7 h-7 text-primary" />
          </div>
          <h1 class="text-xl font-bold uppercase tracking-wider">Sign in</h1>
          <p class="text-sm text-muted-foreground mt-1">Protected — enter your username and password</p>
        </div>

        <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-sm text-sm">
          {{ error }}
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              v-model="username"
              class="w-full h-11 pl-10 pr-4 bg-input border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
              placeholder="admin"
              autocomplete="username"
              autofocus
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              v-model="password"
              :type="show ? 'text' : 'password'"
              class="w-full h-11 pl-10 pr-10 bg-input border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button type="button" @click="show = !show" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <EyeOff v-if="show" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full h-12 bg-primary hover:brightness-110 disabled:opacity-50 text-primary-foreground font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2"
        >
          <template v-if="loading">Signing in…</template>
          <template v-else><LogIn class="w-5 h-5" /> Sign in</template>
        </button>
      </form>

      <div class="text-center text-xs text-muted-foreground mt-4">All data is stored on the server (Neon Postgres). Offline fallback uses this browser only.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-vue-next'
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
