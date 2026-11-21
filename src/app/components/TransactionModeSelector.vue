<template>
  <div v-if="isReadOnly && currentMode" :class="['inline-flex items-center px-4 py-2.5 rounded-none font-semibold text-base shadow-lg', currentMode.activeClass]">
    {{ currentMode.label }}
  </div>
  <div v-else class="inline-flex bg-muted rounded-[4px] p-1 gap-1 border border-border">
    <button
      v-for="mode in modes"
      :key="mode.id"
      @click="$emit('select-mode', mode.id)"
      :class="['relative px-8 py-2.5 rounded-sm font-black uppercase font-semibold transition-colors duration-200 z-10', selectedMode === mode.id ? 'text-black' : 'text-muted-foreground hover:text-foreground hover:bg-card']"
    >
      <span v-if="selectedMode === mode.id" :class="['absolute inset-0 rounded-sm', mode.bg]" style="z-index:-1"></span>
      {{ mode.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ selectedMode: 'sell' | 'buy' | 'exchange'; isReadOnly?: boolean }>()
defineEmits<{ 'select-mode': [mode: 'sell' | 'buy' | 'exchange'] }>()

const modes = [
  { id: 'sell' as const, label: 'Sell', bg: 'bg-[#34D399]', activeClass: 'bg-[#34D399] text-black' },
  { id: 'buy' as const, label: 'Buy', bg: 'bg-[#A78BFA]', activeClass: 'bg-[#A78BFA] text-black' },
  { id: 'exchange' as const, label: 'Exchange', bg: 'bg-[#60A5FA]', activeClass: 'bg-[#60A5FA] text-black' },
]
const currentMode = computed(() => modes.find(m => m.id === props.selectedMode))
</script>
