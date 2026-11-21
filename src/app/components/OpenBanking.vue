<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
    <template v-if="performTill">
      <PerformOpenBanking
        :float-name="performTill.name"
        :expected-amount="performTill.openingFloat || 0"
        :currency="currency"
        @close="performTill = null"
        @complete="onPerformComplete"
      />
    </template>
    <template v-else>
      <div class="bg-card max-w-2xl w-full p-6 shadow-2xl border border-border">
        <div class="flex items-center justify-between mb-6">
          <div class="text-left">
            <h1 class="text-2xl font-medium mb-1 text-foreground">Select Float</h1>
            <p class="text-sm text-muted-foreground">Select your starting float to begin your shift</p>
          </div>
          <button
            v-if="canClose"
            @click="$emit('close')"
            class="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            title="Close"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <div v-if="tills.length === 0" class="text-center text-muted-foreground py-10">
          No tills configured. Add tills in Admin → Tills.
        </div>

        <div v-else class="grid grid-cols-2 gap-3 mb-6">
          <button
            v-for="t in tills"
            :key="t.id"
            @click="selected = t"
            :class="[
              'p-5 rounded-xl border transition-all text-left group relative flex items-center gap-5',
              selected?.id === t.id
                ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                : 'border-border hover:border-primary/50 bg-card hover:bg-muted active:bg-muted/80'
            ]"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xl font-medium text-foreground leading-tight mb-1">{{ t.name }}</div>
              <div v-if="t.status === 'open' && t.openedBy" class="flex items-center gap-1.5 text-primary font-medium text-sm">
                <div class="w-1.5 h-1.5 rounded-full bg-primary" />
                {{ t.openedBy }}
              </div>
              <div v-else-if="t.status === 'open'" class="flex items-center gap-1.5 text-primary font-medium text-sm">
                <div class="w-1.5 h-1.5 rounded-full bg-primary" />
                In use
              </div>
              <div v-else class="text-sm text-muted-foreground italic">Unassigned</div>
              <div class="text-xs text-muted-foreground mt-1">
                <template v-if="t.status === 'open'">Float {{ currency }}{{ t.openingFloat.toFixed(2) }} · Expected {{ currency }}{{ expectedFor(t).toFixed(2) }}</template>
                <template v-else>Default float {{ currency }}{{ (t.openingFloat || 0).toFixed(2) }}</template>
              </div>
            </div>

            <div class="flex flex-col gap-3 shrink-0 items-end">
              <div class="flex gap-2">
                <div
                  class="p-2 rounded-lg flex items-center justify-center transition-colors"
                  :class="t.status === 'open' ? 'text-emerald-500' : 'text-muted-foreground'"
                  :title="t.status === 'open' ? 'Has Cash / Open' : 'Closed'"
                >
                  <Wallet class="w-5 h-5" />
                </div>
                <div
                  v-if="t.status === 'open'"
                  class="p-2 rounded-lg flex items-center justify-center transition-colors text-blue-500"
                  title="Banking Open"
                >
                  <Landmark class="w-5 h-5" />
                </div>
              </div>
            </div>
          </button>
        </div>

        <button
          @click="confirm"
          :class="[
            'w-full rounded-xl py-3.5 text-base font-semibold flex items-center justify-center gap-2.5 transition-colors shadow-lg',
            selected ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-muted text-muted-foreground cursor-not-allowed'
          ]"
          :disabled="!selected"
        >
          <span>{{ buttonLabel }}</span>
          <ArrowRight v-if="selected" class="w-5 h-5" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Wallet, Landmark, ArrowRight } from 'lucide-vue-next'
import { useStore } from '@/store/useStore'
import { tillExpectedCash } from '@/utils/format'
import type { Till, Sale } from '@/types'
import PerformOpenBanking from './PerformOpenBanking.vue'

const props = defineProps<{ tills: Till[]; sales: Sale[]; currency: string }>()
const emit = defineEmits<{ complete: [data: { amount: number; name: string }]; close: [] }>()

const store = useStore()
const selected = ref<Till | null>(null)
const performTill = ref<Till | null>(null)

const canClose = computed(() => props.tills.some((t) => t.status === 'open'))

function expectedFor(t: Till) {
  return t.status === 'open' ? tillExpectedCash(t, props.sales) : (t.openingFloat || 0)
}

const buttonLabel = computed(() => {
  if (!selected.value) return 'Select a Float to Continue'
  if (selected.value.status === 'open') return `Use ${selected.value.name}`
  return `Open ${selected.value.name}`
})

function confirm() {
  if (!selected.value) return
  if (selected.value.status === 'open') {
    store.setActiveTill(selected.value.id)
    emit('complete', { amount: selected.value.openingFloat, name: selected.value.name })
    return
  }
  performTill.value = selected.value
}

function onPerformComplete(data: { amount: number; openedBy: string }) {
  if (!performTill.value) return
  const t = performTill.value
  store.openTill(t.id, data.openedBy || 'Staff', Number(data.amount) || 0)
  store.setActiveTill(t.id)
  emit('complete', { amount: Number(data.amount) || 0, name: t.name })
  performTill.value = null
}
</script>
