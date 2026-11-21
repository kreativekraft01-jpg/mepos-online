<template>
  <div class="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#DB7337]/10 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#DB7337]/5 rounded-full blur-[100px]"></div>
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0); background-size: 40px 40px;"></div>
    </div>

    <div class="relative z-10 flex flex-col items-center gap-16 w-full max-w-5xl">
      <!-- Branding -->
      <div class="text-center space-y-4">
        <div class="text-7xl md:text-8xl font-black italic tracking-tighter text-white relative inline-block">
          ME<span class="text-[#DB7337] drop-shadow-[0_0_25px_rgba(219,115,55,0.6)]">PoS</span>
          <div class="absolute -bottom-2 -right-4 w-12 h-1 bg-[#DB7337] skew-x-[-20deg]"></div>
        </div>
        <div class="flex flex-col items-center gap-2 mt-4">
          <div class="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <MapPin class="w-3 h-3 text-[#DB7337]" />
            <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">{{ branchName }}</span>
          </div>
          <div class="text-neutral-500 font-mono text-sm tracking-widest flex items-center gap-3">
            <span>{{ timeString }}</span>
            <span class="w-1 h-1 bg-[#DB7337] rounded-full"></span>
            <span>{{ dateString }}</span>
          </div>
        </div>
      </div>

      <!-- Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        <button
          class="group relative h-80 md:h-[400px] bg-[#0A0C0E] border border-[#2A2F34] overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 hover:border-[#DB7337]/50"
          @mouseenter="hovered = 'home'"
          @mouseleave="hovered = null"
          @click="$emit('navigate', 'home')"
        >
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,rgba(219,115,55,0.1)_0%,transparent_70%)]"></div>
          <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
          <div class="relative transition-transform duration-500" :class="hovered === 'home' ? 'scale-110 -translate-y-2' : ''">
            <div class="w-24 h-24 rounded-full border border-[#2A2F34] flex items-center justify-center bg-[#161A1E] transition-colors duration-500" :class="hovered === 'home' ? 'border-[#DB7337]/50 bg-[#DB7337]/10' : ''">
              <Home class="w-10 h-10 transition-colors duration-500" :class="hovered === 'home' ? 'text-[#DB7337]' : 'text-neutral-500'" :stroke-width="1.5" />
            </div>
            <Zap v-if="hovered === 'home'" class="absolute -top-2 -right-2 w-6 h-6 text-[#DB7337] animate-pulse" />
          </div>
          <div class="text-center space-y-2 relative z-10">
            <h3 class="text-4xl font-black tracking-tighter text-white transition-all duration-300" :class="hovered === 'home' ? 'text-[#DB7337]' : ''">HOME</h3>
            <p class="text-sm font-medium tracking-[0.3em] uppercase text-neutral-500 transition-colors duration-300" :class="hovered === 'home' ? 'text-neutral-300' : ''">Launch Dashboard</p>
          </div>
          <div class="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-500" :class="hovered === 'home' ? 'opacity-100 translate-y-0 text-[#DB7337]' : 'opacity-0 translate-y-2 text-neutral-600'">
            <span>Initialize Session</span>
            <ArrowRight class="w-3 h-3" />
          </div>
          <div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#2A2F34] group-hover:border-[#DB7337]/50"></div>
          <div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#2A2F34] group-hover:border-[#DB7337]/50"></div>
        </button>

        <button
          class="group relative h-80 md:h-[400px] bg-[#0A0C0E] border border-[#2A2F34] overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 hover:border-[#DB7337]/50"
          @mouseenter="hovered = 'cart'"
          @mouseleave="hovered = null"
          @click="$emit('navigate', 'cart')"
        >
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,rgba(219,115,55,0.1)_0%,transparent_70%)]"></div>
          <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
          <div class="relative transition-transform duration-500" :class="hovered === 'cart' ? 'scale-110 -translate-y-2' : ''">
            <div class="w-24 h-24 rounded-full border border-[#2A2F34] flex items-center justify-center bg-[#161A1E] transition-colors duration-500" :class="hovered === 'cart' ? 'border-[#DB7337]/50 bg-[#DB7337]/10' : ''">
              <ShoppingCart class="w-10 h-10 transition-colors duration-500" :class="hovered === 'cart' ? 'text-[#DB7337]' : 'text-neutral-500'" :stroke-width="1.5" />
            </div>
            <ScanLine v-if="hovered === 'cart'" class="absolute -top-2 -right-2 w-6 h-6 text-[#DB7337] animate-pulse" />
          </div>
          <div class="text-center space-y-2 relative z-10">
            <h3 class="text-4xl font-black tracking-tighter text-white transition-all duration-300" :class="hovered === 'cart' ? 'text-[#DB7337]' : ''">CART</h3>
            <p class="text-sm font-medium tracking-[0.3em] uppercase text-neutral-500 transition-colors duration-300" :class="hovered === 'cart' ? 'text-neutral-300' : ''">New Transaction</p>
          </div>
          <div class="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-500" :class="hovered === 'cart' ? 'opacity-100 translate-y-0 text-[#DB7337]' : 'opacity-0 translate-y-2 text-neutral-600'">
            <span>Begin Processing</span>
            <ArrowRight class="w-3 h-3" />
          </div>
          <div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#2A2F34] group-hover:border-[#DB7337]/50"></div>
          <div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#2A2F34] group-hover:border-[#DB7337]/50"></div>
        </button>
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="flex items-center gap-8 px-6 py-3 bg-[#161A1E]/50 border border-[#2A2F34] backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-[#DB7337] animate-pulse"></div>
            <span class="text-[10px] font-bold tracking-widest uppercase text-neutral-400">System Ready</span>
          </div>
          <div class="w-px h-3 bg-[#2A2F34]"></div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold tracking-widest uppercase text-neutral-500">Press any key to unlock</span>
            <ChevronDown class="w-3 h-3 text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Home, ShoppingCart, ChevronDown, MapPin, Zap, ArrowRight, ScanLine } from 'lucide-vue-next'

defineProps<{ branchName: string }>()
defineEmits<{ navigate: [target: 'home' | 'cart'] }>()

const now = ref(new Date())
const hovered = ref<'home' | 'cart' | null>(null)
let timer: any = null

const timeString = computed(() => now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
const dateString = computed(() => now.value.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }))

onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onBeforeUnmount(() => clearInterval(timer))
</script>
