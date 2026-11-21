<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="$emit('cancel')"></div>
        <div class="relative bg-card rounded-none shadow-2xl w-full max-w-md overflow-hidden border-2 border-border">
          <div class="bg-muted px-8 py-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div :class="['p-2 rounded-none', danger ? 'bg-destructive/10' : 'bg-primary/20']">
                <AlertTriangle :class="['w-6 h-6', danger ? 'text-destructive' : 'text-primary']" />
              </div>
              <h2 class="text-2xl font-bold text-foreground">{{ title }}</h2>
            </div>
            <button @click="$emit('cancel')" class="p-2 hover:bg-background rounded-none transition-colors text-muted-foreground hover:text-foreground">
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="p-8">
            <p class="text-lg text-muted-foreground">{{ message }}</p>
            <div class="flex gap-4 pt-8">
              <button @click="$emit('cancel')" class="flex-1 px-6 py-4 border-2 border-border rounded-none text-muted-foreground font-bold hover:bg-muted hover:text-foreground transition-colors uppercase tracking-widest">Cancel</button>
              <button @click="$emit('confirm')" :class="['flex-1 px-6 py-4 rounded-none font-bold transition-all shadow-lg active:scale-95 uppercase tracking-widest', danger ? 'bg-destructive hover:brightness-110 text-destructive-foreground' : 'bg-primary hover:brightness-110 text-primary-foreground']">{{ confirmLabel }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X, AlertTriangle } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ isOpen: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean }>(), { confirmLabel: 'Confirm', danger: false })
const emit = defineEmits<{ cancel: []; confirm: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}
watch(() => props.isOpen, (v) => {
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
}, { immediate: true })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
