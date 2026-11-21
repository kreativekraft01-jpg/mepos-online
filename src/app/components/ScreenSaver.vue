<template>
  <div class="screensaver fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
    <!-- Dynamic Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="screensaver-blob screensaver-blob--top absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#DB7337]/10 blur-[150px] rounded-full"></div>
      <div class="screensaver-blob screensaver-blob--bottom absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-[#DB7337]/10 blur-[150px] rounded-full"></div>
      <!-- Grid Pattern Overlay -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
    </div>

    <div class="relative z-10 w-full max-w-4xl flex flex-col items-center gap-16">
      <!-- Logo / Branding -->
      <div class="text-center space-y-2">
        <div class="screensaver-logo text-8xl font-black italic tracking-tighter text-white relative inline-block">
          ME<span class="text-[#DB7337] drop-shadow-[0_0_25px_rgba(219,115,55,0.6)]">PoS</span>
          <div class="screensaver-underline absolute -bottom-4 right-0 h-1.5 bg-[#DB7337]"></div>
        </div>
        <div class="screensaver-meta flex items-center justify-center gap-3 text-neutral-400 font-mono text-sm tracking-widest uppercase px-[0px] py-[16px]">
          <span>{{ branchName }}</span>
          <span class="w-1 h-1 bg-[#DB7337] rounded-full"></span>
          <span>{{ timeString }}</span>
        </div>
      </div>

      <!-- Main Actions -->
      <div class="grid grid-cols-2 gap-8 w-full max-w-2xl">
        <button
          class="nav-btn group relative h-64 w-full bg-[#0A0C0E] border border-[#2A2F34] overflow-hidden"
          :class="{ 'is-hovered': hovered === 'home' }"
          @mouseenter="hovered = 'home'"
          @mouseleave="hovered = null"
          @click="$emit('navigate', 'home')"
        >
          <div class="nav-btn-bg absolute inset-0 bg-gradient-to-br from-[#161A1E] to-transparent z-0"></div>
          <span class="nav-border nav-border--top absolute top-0 left-0 w-full h-[2px] z-10 bg-[#DB7337]"></span>
          <span class="nav-border nav-border--bottom absolute bottom-0 right-0 w-full h-[2px] z-10 bg-[#DB7337]"></span>
          <span class="nav-border nav-border--right absolute top-0 right-0 w-[2px] h-full z-10 bg-[#DB7337]"></span>
          <span class="nav-border nav-border--left absolute bottom-0 left-0 w-[2px] h-full z-10 bg-[#DB7337]"></span>

          <div class="relative z-20 h-full flex flex-col items-center justify-center gap-6">
            <div class="relative">
              <div class="nav-icon text-neutral-600">
                <Home class="w-10 h-10" />
              </div>
            </div>
            <div class="text-center space-y-2">
              <div class="nav-label text-4xl font-black tracking-tighter text-white">HOME</div>
              <div class="flex items-center justify-center gap-2 overflow-hidden h-6">
                <div class="nav-sublabel flex flex-col items-center">
                  <span class="text-xs font-bold uppercase tracking-[0.2em] h-6 flex items-center gap-2 text-[#DB7337]">Enter <ArrowRight class="w-3 h-3" /></span>
                </div>
              </div>
            </div>
          </div>

          <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
          <div class="absolute top-2 right-2 w-2 h-2 border-t border-r border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
          <div class="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
          <div class="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
        </button>

        <button
          class="nav-btn group relative h-64 w-full bg-[#0A0C0E] border border-[#2A2F34] overflow-hidden"
          :class="{ 'is-hovered': hovered === 'cart' }"
          @mouseenter="hovered = 'cart'"
          @mouseleave="hovered = null"
          @click="$emit('navigate', 'cart')"
        >
          <div class="nav-btn-bg absolute inset-0 bg-gradient-to-br from-[#161A1E] to-transparent z-0"></div>
          <span class="nav-border nav-border--top absolute top-0 left-0 w-full h-[2px] z-10 bg-[#DB7337]"></span>
          <span class="nav-border nav-border--bottom absolute bottom-0 right-0 w-full h-[2px] z-10 bg-[#DB7337]"></span>
          <span class="nav-border nav-border--right absolute top-0 right-0 w-[2px] h-full z-10 bg-[#DB7337]"></span>
          <span class="nav-border nav-border--left absolute bottom-0 left-0 w-[2px] h-full z-10 bg-[#DB7337]"></span>

          <div class="relative z-20 h-full flex flex-col items-center justify-center gap-6">
            <div class="relative">
              <div class="nav-icon text-neutral-600">
                <ShoppingCart class="w-10 h-10" />
              </div>
            </div>
            <div class="text-center space-y-2">
              <div class="nav-label text-4xl font-black tracking-tighter text-white">CART</div>
              <div class="flex items-center justify-center gap-2 overflow-hidden h-6">
                <div class="nav-sublabel flex flex-col items-center">
                  <span class="text-xs font-bold uppercase tracking-[0.2em] h-6 flex items-center gap-2 text-[#DB7337]">Enter <ArrowRight class="w-3 h-3" /></span>
                </div>
              </div>
            </div>
          </div>

          <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
          <div class="absolute top-2 right-2 w-2 h-2 border-t border-r border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
          <div class="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
          <div class="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-neutral-700 transition-colors duration-300 group-hover:border-white/50"></div>
        </button>
      </div>
    </div>

    <!-- Interactive Hint -->
    <div class="screensaver-hint absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      <div class="w-px h-12 bg-gradient-to-b from-transparent via-neutral-600 to-transparent"></div>
      <span class="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em]">System Ready</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Home, ShoppingCart, ArrowRight } from 'lucide-vue-next'

defineProps<{ branchName: string }>()
defineEmits<{ navigate: [target: 'home' | 'cart'] }>()

const now = ref(new Date())
const hovered = ref<'home' | 'cart' | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const timeString = computed(() => now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.screensaver {
  animation: ss-fade-in 0.35s ease-out;
}
@keyframes ss-fade-in { from { opacity: 0 } to { opacity: 1 } }

.screensaver-blob--top {
  animation: ss-blob-top 20s linear infinite;
}
.screensaver-blob--bottom {
  animation: ss-blob-bottom 15s linear infinite 2s;
}
@keyframes ss-blob-top {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 0.1 }
  25% { transform: scale(1.1) rotate(2.5deg); opacity: 0.125 }
  50% { transform: scale(1.2) rotate(5deg); opacity: 0.15 }
  75% { transform: scale(1.1) rotate(-2.5deg); opacity: 0.125 }
}
@keyframes ss-blob-bottom {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 0.05 }
  25% { transform: scale(1.15) rotate(-2.5deg); opacity: 0.075 }
  50% { transform: scale(1.3) rotate(-5deg); opacity: 0.1 }
  75% { transform: scale(1.15) rotate(2.5deg); opacity: 0.075 }
}

.screensaver-logo {
  animation: ss-slide-down 0.8s ease-out;
}
@keyframes ss-slide-down { from { opacity: 0; transform: translateY(-20px) } to { opacity: 1; transform: translateY(0) } }

.screensaver-underline {
  width: 0;
  animation: ss-underline 1.5s cubic-bezier(0,0,0.2,1) 0.5s forwards;
}
@keyframes ss-underline { to { width: 100% } }

.screensaver-meta {
  opacity: 0;
  animation: ss-fade-in 1s ease 1s forwards;
}

.nav-btn {
  transition: transform 0.2s ease;
}
.nav-btn:hover { transform: scale(1.02); }
.nav-btn:active { transform: scale(0.98); }

.nav-btn-bg {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.nav-btn.is-hovered .nav-btn-bg { opacity: 1; }

.nav-border { transform: scale(0); }
.nav-border--top { transform-origin: left; transition: transform 0.4s ease-in-out; }
.nav-border--bottom { transform-origin: right; transition: transform 0.4s ease-in-out; }
.nav-border--right { transform-origin: top; transition: transform 0.4s ease-in-out 0.1s; }
.nav-border--left { transform-origin: bottom; transition: transform 0.4s ease-in-out 0.1s; }
.nav-btn.is-hovered .nav-border--top,
.nav-btn.is-hovered .nav-border--bottom { transform: scaleX(1); }
.nav-btn.is-hovered .nav-border--right,
.nav-btn.is-hovered .nav-border--left { transform: scaleY(1); }

.nav-icon {
  transition: color 0.3s ease, transform 0.3s ease, filter 0.3s ease;
}
.nav-btn.is-hovered .nav-icon {
  color: #DB7337;
  transform: scale(1.1);
  filter: drop-shadow(0 0 15px rgba(219,115,55,0.38));
}

.nav-label {
  transition: transform 0.3s ease;
}
.nav-btn.is-hovered .nav-label { transform: translateY(-2px); }

.nav-sublabel {
  transform: translateY(0);
  transition: transform 0.3s ease;
}
.nav-btn:not(.is-hovered) .nav-sublabel {
  /* keep Enter visible only on hover like legacy intent; legacy showed Enter on hover */
  transform: translateY(30px);
}

.screensaver-hint {
  animation: ss-hint 3s ease-in-out infinite;
}
@keyframes ss-hint {
  0%,100% { opacity: 0.3 }
  50% { opacity: 1 }
}
</style>
