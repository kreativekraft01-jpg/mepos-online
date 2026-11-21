<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-[200]">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>
        <aside class="absolute left-0 top-0 bottom-0 w-[340px] max-w-[90vw] bg-card border-r border-border shadow-2xl flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-none border border-primary/30 shrink-0">
                  <Building2 class="w-5 h-5 text-primary" />
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-sm truncate">{{ currentBranch }}</div>
                  <div class="text-xs text-muted-foreground truncate">{{ currentFloat?.name || 'No till open' }}</div>
                </div>
              </div>
              <button class="p-2 hover:bg-muted rounded-none" @click="$emit('close')"><X class="w-5 h-5" /></button>
            </div>

            <!-- Branch selector -->
            <div class="relative">
              <button @click="branchOpen = !branchOpen" class="w-full flex items-center justify-between px-3 py-2 bg-background border border-border hover:border-primary/40 text-sm">
                <span class="truncate">{{ currentBranch }}</span>
                <ChevronDown class="w-4 h-4 text-muted-foreground" :class="branchOpen ? 'rotate-180' : ''" />
              </button>
              <div v-if="branchOpen" class="absolute z-20 mt-1 w-full bg-card border border-border shadow-xl max-h-48 overflow-auto">
                <button v-for="b in branches" :key="b" @click="selectBranch(b)" class="w-full text-left px-3 py-2 text-sm hover:bg-muted" :class="b === currentBranch ? 'text-primary' : ''">
                  {{ b }}
                </button>
              </div>
            </div>
          </div>

          <!-- Nav -->
          <nav class="flex-1 p-3 space-y-1 overflow-auto">
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-left" @click="goHome">
              <Home class="w-5 h-5" /><span>POS Home</span>
            </button>
            <router-link to="/admin/dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-foreground" @click="$emit('close')">
              <Settings class="w-5 h-5" /><span>Settings / Admin</span>
            </router-link>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-left" @click="$emit('close-banking')">
              <DollarSign class="w-5 h-5" /><span>Close Banking</span>
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-left" @click="$emit('toggle-theme')">
              <component :is="theme === 'dark' ? Sun : Moon" class="w-5 h-5" />
              <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-left" @click="showShortcuts = true">
              <Keyboard class="w-5 h-5" /><span>Keyboard Shortcuts</span>
            </button>
            <a href="#/" class="flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-foreground" @click.prevent="$emit('close')">
              <HelpCircle class="w-5 h-5" /><span>Help</span>
            </a>
            <a href="#/" class="flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-foreground" @click.prevent="$emit('close')">
              <MessageSquare class="w-5 h-5" /><span>Feedback</span>
            </a>
            <a href="#/admin/knowledge" class="flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-muted text-foreground" @click="$emit('close')">
              <BookOpen class="w-5 h-5" /><span>Knowledge Base</span>
            </a>
          </nav>

          <!-- Footer -->
          <div class="p-4 border-t border-border space-y-3">
            <div class="text-xs text-muted-foreground">
              <div v-if="currentFloat">Float: £{{ currentFloat.amount.toFixed(2) }}</div>
              <div v-else>No banking session open</div>
            </div>
            <button class="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-border hover:bg-muted text-sm font-medium" @click="logout">
              <LogOut class="w-4 h-4" /><span>Sign out</span>
            </button>
          </div>
        </aside>

        <!-- Keyboard shortcuts modal -->
        <div v-if="showShortcuts" class="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="showShortcuts = false"></div>
          <div class="relative bg-card border border-border w-full max-w-lg shadow-2xl">
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 class="font-bold uppercase tracking-wider text-sm flex items-center gap-2"><Keyboard class="w-4 h-4 text-primary" /> Keyboard Shortcuts</h3>
              <button class="p-1 hover:bg-muted" @click="showShortcuts = false"><X class="w-4 h-4" /></button>
            </div>
            <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div v-for="s in shortcuts" :key="s.keys" class="flex items-center justify-between gap-3 border border-border px-3 py-2">
                <span class="text-muted-foreground">{{ s.label }}</span>
                <kbd class="px-2 py-0.5 bg-muted border border-border text-xs font-mono">{{ s.keys }}</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, Home, Settings, DollarSign, LogOut, Building2, Sun, Moon, Keyboard, HelpCircle, MessageSquare, BookOpen, ChevronDown } from 'lucide-vue-next'
import { useAuthStore } from '@/store/authStore'

const props = defineProps<{
  isOpen: boolean
  currentFloat: { amount: number; name: string } | null
  theme?: 'dark' | 'light'
}>()

const emit = defineEmits<{ close: []; 'close-banking': []; 'toggle-theme': [] }>()

const branches = ['CeX Watford', 'CeX Harrow', 'CeX London', 'CeX Birmingham', 'CeX Manchester']
const currentBranch = ref(props.currentFloat?.name || 'CeX Watford')
const branchOpen = ref(false)
const showShortcuts = ref(false)

const shortcuts = [
  { keys: 'N', label: 'New transaction (Home)' },
  { keys: 'U', label: 'New customer (Home)' },
  { keys: 'C', label: 'Current transaction (Home)' },
  { keys: 'R', label: 'Refund (Home)' },
  { keys: 'T', label: 'Test orders (Home)' },
  { keys: 'G', label: 'Gift voucher (Home)' },
  { keys: 'P', label: 'Price request (Home)' },
  { keys: 'S', label: 'Customer search (Cart)' },
  { keys: 'Enter', label: 'Proceed to payment (Cart)' },
  { keys: 'Esc', label: 'Close / Back' },
  { keys: 'F1-F4, F8', label: 'Navigation shortcuts' },
]

function selectBranch(b: string) { currentBranch.value = b; branchOpen.value = false }
function goHome() { emit('close'); window.location.hash = '#/' }
function logout() {
  useAuthStore.getState().logout()
  window.location.hash = '#/login'
}
</script>
