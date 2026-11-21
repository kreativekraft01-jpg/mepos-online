<template>
  <div class="fixed inset-0 bg-background flex flex-col z-[120] overflow-hidden text-foreground">
    <div class="bg-card border-b border-border px-6 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-10">
      <div class="flex items-center gap-3">
        <button @click="$emit('close')" class="p-2 hover:bg-muted rounded transition-colors">
          <ChevronLeft class="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 class="text-lg font-bold">Open Banking ({{ floatName }})</h1>
          <p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Shift Commencement</p>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="text-right">
          <p class="text-[9px] font-bold text-muted-foreground uppercase">Expected</p>
          <p class="text-lg font-bold text-muted-foreground">{{ currency }}{{ expectedAmount.toFixed(2) }}</p>
        </div>
        <div class="h-6 w-px bg-border" />
        <div class="text-right">
          <p class="text-[9px] font-bold text-muted-foreground uppercase">Current Total</p>
          <p :class="['text-lg font-bold', isBalanced ? 'text-green-500' : 'text-blue-500']">
            {{ currency }}{{ totalAmount.toFixed(2) }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden p-4 lg:p-6">
      <div class="max-w-[1600px] mx-auto h-full grid grid-cols-12 gap-6">
        <div class="col-span-9 flex flex-col overflow-hidden">
          <div class="flex items-center justify-between mb-3 px-1">
            <h2 class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Banknote class="w-4 h-4 text-muted-foreground" />
              Float Verification
            </h2>
            <button @click="askClear = true" class="text-[10px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors">
              <Trash2 class="w-3.5 h-3.5" /> RESET
            </button>
          </div>

          <div class="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
            <div class="bg-card rounded border border-border shadow-sm flex flex-col overflow-hidden">
              <div class="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Banknote class="w-3.5 h-3.5 text-green-500" />
                  Notes
                </span>
                <span class="text-sm font-bold text-foreground">{{ currency }}{{ notesTotal.toFixed(2) }}</span>
              </div>
              <div class="overflow-y-auto flex-1">
                <div class="grid grid-cols-12 px-4 py-2 bg-muted/50 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div class="col-span-3">Unit</div>
                  <div class="col-span-5 text-center">Qty</div>
                  <div class="col-span-4 text-right">Subtotal</div>
                </div>
                <div v-for="item in notes" :key="item.label" class="grid grid-cols-12 px-4 py-3.5 items-center group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                  <div class="col-span-3">
                    <div class="inline-flex items-center justify-center min-w-[60px] px-3 py-2 font-bold text-sm text-green-500">{{ item.label }}</div>
                  </div>
                  <div class="col-span-5 flex justify-center">
                    <div class="flex items-center gap-1.5 bg-muted p-1 border border-border">
                      <button @click="updateCount(item.label, -1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted/80 text-muted-foreground transition-all active:scale-90"><Minus class="w-4 h-4" /></button>
                      <input type="number" :value="counts[item.label] || ''" placeholder="0" @input="onQty(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-12 text-center font-bold text-foreground bg-transparent border-none focus:ring-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button @click="updateCount(item.label, 1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted/80 text-muted-foreground transition-all active:scale-90"><Plus class="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div class="col-span-4 flex justify-end">
                    <div class="relative w-28">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{{ currency }}</span>
                      <input type="number" :step="item.value" :value="(counts[item.label] * item.value) || ''" placeholder="0.00" @input="onSubtotal(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-full bg-muted/50 border border-border py-2.5 pl-6 pr-3 font-bold text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all text-sm text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-card rounded border border-border shadow-sm flex flex-col overflow-hidden">
              <div class="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Coins class="w-3.5 h-3.5 text-amber-500" />
                  Coins
                </span>
                <span class="text-sm font-bold text-foreground">{{ currency }}{{ coinsTotal.toFixed(2) }}</span>
              </div>
              <div class="overflow-y-auto flex-1">
                <div class="grid grid-cols-12 px-4 py-2 bg-muted/50 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div class="col-span-3">Unit</div>
                  <div class="col-span-5 text-center">Qty</div>
                  <div class="col-span-4 text-right">Subtotal</div>
                </div>
                <div v-for="item in coins" :key="item.label" class="grid grid-cols-12 px-4 py-3.5 items-center group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                  <div class="col-span-3">
                    <div class="inline-flex items-center justify-center min-w-[60px] px-3 py-2 font-bold text-sm text-amber-500">{{ item.label }}</div>
                  </div>
                  <div class="col-span-5 flex justify-center">
                    <div class="flex items-center gap-1.5 bg-muted p-1 border border-border">
                      <button @click="updateCount(item.label, -1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted/80 text-muted-foreground transition-all active:scale-90"><Minus class="w-4 h-4" /></button>
                      <input type="number" :value="counts[item.label] || ''" placeholder="0" @input="onQty(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-12 text-center font-bold text-foreground bg-transparent border-none focus:ring-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button @click="updateCount(item.label, 1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted/80 text-muted-foreground transition-all active:scale-90"><Plus class="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div class="col-span-4 flex justify-end">
                    <div class="relative w-28">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{{ currency }}</span>
                      <input type="number" :step="item.value" :value="(counts[item.label] * item.value) || ''" placeholder="0.00" @input="onSubtotal(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-full bg-muted/50 border border-border py-2.5 pl-6 pr-3 font-bold text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all text-sm text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-3 flex flex-col space-y-4 overflow-hidden">
          <section class="bg-card rounded border border-border shadow-sm p-5 space-y-4">
            <div class="flex items-center gap-2">
              <Lock class="w-4 h-4 text-muted-foreground" />
              <h2 class="font-bold text-xs uppercase tracking-wider text-muted-foreground">Security Check</h2>
            </div>

            <div class="space-y-4">
              <div class="p-3 bg-muted/50 border border-border">
                <label class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Float Seal Number</label>
                <div class="flex items-center gap-2 text-foreground font-mono font-bold">
                  <Hash class="w-3.5 h-3.5 text-muted-foreground" />
                  {{ floatSealNumber }}
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Bag Seal Number</label>
                <div class="relative">
                  <Hash class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input v-model="bagSealNumber" type="text" class="w-full bg-input border border-border py-3 pl-9 pr-4 font-bold text-sm text-foreground focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground" placeholder="Enter bag seal ID..." />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Opened By</label>
                <input v-model="openedBy" type="text" class="w-full bg-input border border-border py-3 px-4 font-bold text-sm text-foreground focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground" placeholder="Staff name" />
              </div>
            </div>
          </section>

          <section class="bg-muted/20 p-5 text-foreground border border-border shadow-xl flex-1 flex flex-col justify-between">
            <div class="space-y-5">
              <div class="space-y-3">
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-muted-foreground uppercase tracking-widest">Expected Float</span>
                  <span class="font-bold text-[12px]">{{ currency }}{{ expectedAmount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-muted-foreground uppercase tracking-widest">Counted Now</span>
                  <span class="font-bold text-[12px]">{{ currency }}{{ totalAmount.toFixed(2) }}</span>
                </div>
                <div class="h-px bg-border my-1" />
                <div class="flex justify-between items-center">
                  <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Variance</span>
                  <span :class="['text-sm font-bold', isBalanced ? 'text-green-500' : 'text-amber-500']">
                    {{ currency }}{{ (totalAmount - expectedAmount).toFixed(2) }}
                  </span>
                </div>
              </div>

              <div v-if="!isBalanced" class="p-3 bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p class="text-[12px] text-amber-500 leading-relaxed font-regular">
                  Variance detected between expected amount and your count. You can still confirm to open with the counted total.
                </p>
              </div>
            </div>

            <div class="space-y-3 mt-6">
              <button
                :disabled="!bagSealNumber || !openedBy.trim()"
                @click="confirm"
                :class="['w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95', (!bagSealNumber || !openedBy.trim()) ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20']"
              >
                Confirm & Open
                <ArrowRight class="w-4 h-4" />
              </button>
              <p class="text-[8px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                Confirming will initialize shift records
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="askClear"
      title="Clear All Counts"
      message="Are you sure you want to clear all counts? This will reset every denomination you have entered."
      confirm-label="Clear All"
      :danger="true"
      @cancel="askClear = false"
      @confirm="clearAll"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Minus, Banknote, Coins, ArrowRight, ChevronLeft, Trash2, Lock, Hash, AlertTriangle } from 'lucide-vue-next'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = withDefaults(defineProps<{
  floatName: string
  expectedAmount: number
  currency?: string
}>(), { currency: '£' })

const emit = defineEmits<{ close: []; complete: [data: { amount: number; openedBy: string }] }>()

const DENOMS = [
  { label: '£50.00', value: 50, type: 'note' },
  { label: '£20.00', value: 20, type: 'note' },
  { label: '£10.00', value: 10, type: 'note' },
  { label: '£5.00', value: 5, type: 'note' },
  { label: '£2.00', value: 2, type: 'coin' },
  { label: '£1.00', value: 1, type: 'coin' },
  { label: '50p', value: 0.5, type: 'coin' },
  { label: '20p', value: 0.2, type: 'coin' },
  { label: '10p', value: 0.1, type: 'coin' },
  { label: '5p', value: 0.05, type: 'coin' },
] as const

const counts = reactive<Record<string, number>>(Object.fromEntries(DENOMS.map(d => [d.label, 0])))
const bagSealNumber = ref('')
const openedBy = ref('')
const askClear = ref(false)
const floatSealNumber = 'FS-' + Math.random().toString(36).slice(2, 8).toUpperCase()

const notes = computed(() => DENOMS.filter(d => d.type === 'note'))
const coins = computed(() => DENOMS.filter(d => d.type === 'coin'))
const notesTotal = computed(() => notes.value.reduce((s, d) => s + (counts[d.label] || 0) * d.value, 0))
const coinsTotal = computed(() => coins.value.reduce((s, d) => s + (counts[d.label] || 0) * d.value, 0))
const totalAmount = computed(() => Math.round((notesTotal.value + coinsTotal.value) * 100) / 100)
const isBalanced = computed(() => Math.abs(totalAmount.value - props.expectedAmount) < 0.01)

function updateCount(label: string, delta: number) {
  counts[label] = Math.max(0, (counts[label] || 0) + delta)
}
function onQty(label: string, value: string, _v: number) {
  const n = parseInt(value, 10)
  counts[label] = Number.isFinite(n) && n > 0 ? n : 0
}
function onSubtotal(label: string, value: string, denValue: number) {
  const subtotal = parseFloat(value) || 0
  counts[label] = Math.max(0, Math.floor(subtotal / denValue))
}
function clearAll() {
  for (const d of DENOMS) counts[d.label] = 0
  askClear.value = false
}
function confirm() {
  if (!bagSealNumber.value || !openedBy.value.trim()) return
  emit('complete', { amount: totalAmount.value, openedBy: openedBy.value.trim() })
}
</script>
