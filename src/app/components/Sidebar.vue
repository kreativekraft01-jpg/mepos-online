<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-[200]">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
        <aside class="absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-sidebar border-r border-sidebar-border shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
          <!-- Header -->
          <div class="bg-sidebar text-sidebar-foreground p-6 flex items-center justify-between border-b border-sidebar-border shrink-0">
            <div class="text-2xl font-black italic tracking-tighter text-sidebar-foreground relative">
              ME<span class="text-primary drop-shadow-[0_0_10px_rgba(219,115,55,0.5)]">PoS</span>
              <div class="absolute -bottom-1 right-0 w-8 h-0.5 bg-primary/50"></div>
            </div>
            <button @click="$emit('close')" class="p-2 hover:bg-sidebar-accent rounded-none transition-colors group">
              <X class="w-6 h-6 text-muted-foreground group-hover:text-sidebar-foreground transition-transform group-hover:rotate-90" />
            </button>
          </div>

          <!-- Menu Items -->
          <div class="flex-1 overflow-y-auto bg-sidebar">
            <nav class="p-4 space-y-2">
              <button @click="goHome" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-all text-left group relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <Home class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Home</span>
              </button>

              <!-- Change Branch -->
              <div class="relative">
                <button @click="branchOpen = !branchOpen" class="w-full flex items-center justify-between px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                  <div class="flex items-center gap-4 min-w-0">
                    <Building2 class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <span class="text-lg font-bold text-sidebar-foreground truncate">{{ currentBranch }}</span>
                  </div>
                  <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0" :class="branchOpen ? 'rotate-180' : ''" />
                </button>
                <div v-if="branchOpen" class="overflow-hidden bg-sidebar-accent/50 border-y border-sidebar-border">
                  <button v-for="b in branches" :key="b" @click="selectBranch(b)"
                    class="w-full flex items-center px-14 py-3 hover:bg-sidebar-accent transition-colors text-left text-base"
                    :class="currentBranch === b ? 'text-primary font-bold' : 'text-muted-foreground hover:text-sidebar-foreground'">
                    {{ b }}
                  </button>
                </div>
              </div>

              <router-link to="/admin/settings" @click="$emit('close')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <Settings class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Settings</span>
              </router-link>

              <div class="h-px bg-sidebar-border mx-4 my-2" />

              <button @click="$emit('close')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <MessageSquare class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Feedback</span>
              </button>

              <button @click="$emit('close')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <BookOpen class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Beginners Guide</span>
              </button>

              <router-link to="/admin/settings" @click="$emit('close')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <Sparkles class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Knowledge Base</span>
              </router-link>

              <button @click="$emit('close')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <Sparkles class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">What's New</span>
              </button>

              <div class="h-px bg-sidebar-border mx-4 my-2" />

              <button @click="$emit('close')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <HelpCircle class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Help</span>
              </button>

              <button @click="showShortcuts = true" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
                <Keyboard class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span class="text-lg font-bold text-sidebar-foreground">Keyboard Shortcuts</span>
              </button>
            </nav>
          </div>

          <!-- Footer -->
          <div class="border-t border-sidebar-border p-4 space-y-3 bg-sidebar shrink-0">
            <div v-if="currentFloat" class="bg-card border border-sidebar-border rounded-none p-4 shadow-lg">
              <div class="text-sm text-muted-foreground mb-1 font-bold uppercase tracking-wider">Current Float</div>
              <div class="text-lg text-sidebar-foreground font-bold">{{ currentFloat.name }}</div>
            </div>

            <button @click="$emit('toggle-theme')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
              <component :is="theme === 'dark' ? Sun : Moon" class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span class="text-lg font-bold text-sidebar-foreground">{{ theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>

            <button @click="$emit('close-banking')" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-sidebar-accent rounded-none transition-colors text-left group relative">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
              <DollarSign class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span class="text-lg font-bold text-sidebar-foreground">Close Banking</span>
            </button>

            <button @click="logout" class="w-full flex items-center gap-4 px-4 py-4 hover:bg-destructive/10 rounded-none transition-colors text-left group relative">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-destructive scale-y-0 group-hover:scale-y-100 transition-transform duration-200" />
              <LogOut class="w-6 h-6 text-muted-foreground group-hover:text-destructive transition-colors" />
              <span class="text-lg font-bold text-sidebar-foreground group-hover:text-destructive transition-colors">Sign Out</span>
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
