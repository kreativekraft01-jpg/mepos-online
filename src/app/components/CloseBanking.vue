<template>
  <div class="fixed inset-0 bg-background flex flex-col z-[120] overflow-hidden text-foreground">
    <!-- Header -->
    <div class="bg-card border-b border-border px-6 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-10">
      <div class="flex items-center gap-3">
        <button @click="$emit('close')" class="p-2 hover:bg-muted transition-colors">
          <ChevronLeft class="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 class="text-lg font-bold">Close Banking <span v-if="till">({{ till.name }})</span></h1>
          <p class="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{{ todayLabel }}</p>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="text-right">
          <p class="text-[11px] font-bold text-muted-foreground uppercase">Target</p>
          <p class="text-lg font-bold">{{ currency }}{{ expected.toFixed(2) }}</p>
        </div>
        <div class="h-6 w-px bg-border" />
        <div class="text-right">
          <p class="text-[11px] font-bold text-muted-foreground uppercase">Declared</p>
          <p :class="['text-lg font-bold', hasVariance ? 'text-primary' : 'text-green-500']">
            {{ currency }}{{ totalDeclared.toFixed(2) }}
          </p>
        </div>
        <div v-if="hasVariance" class="bg-destructive/10 px-3 py-1.5 border border-destructive/20 flex items-center gap-1.5">
          <AlertTriangle class="w-4 h-4 text-destructive" />
          <span class="text-xs font-bold text-destructive">{{ currency }}{{ variance.toFixed(2) }} Var</span>
        </div>
        <div v-else class="bg-green-500/10 px-3 py-1.5 border border-green-500/20 flex items-center gap-1.5">
          <CheckCircle2 class="w-4 h-4 text-green-500" />
          <span class="text-xs font-bold text-green-500">Balanced</span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden p-4 lg:p-6">
      <div v-if="!till" class="text-muted-foreground">No open till selected.</div>
      <div v-else class="max-w-[1600px] mx-auto h-full grid grid-cols-12 gap-6">
        <!-- Main workspace -->
        <div class="col-span-9 flex flex-col overflow-hidden">
          <div class="flex items-center justify-between mb-3 px-1">
            <h2 class="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Banknote class="w-4 h-4 text-muted-foreground" />
              Cash Breakdown
            </h2>
            <button @click="showClearDialog = true" class="text-[12px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors">
              <Trash2 class="w-3.5 h-3.5" /> RESET ALL
            </button>
          </div>

          <div class="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
            <!-- Notes -->
            <div class="bg-card border border-border shadow-sm flex flex-col overflow-hidden">
              <div class="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Banknote class="w-3.5 h-3.5 text-green-500" />
                  Notes
                </span>
                <span class="text-sm font-bold">{{ currency }}{{ notesTotal.toFixed(2) }}</span>
              </div>
              <div class="overflow-y-auto flex-1">
                <div class="grid grid-cols-12 px-4 py-2 bg-muted/50 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div class="col-span-3 text-[11px]">Unit</div>
                  <div class="col-span-5 text-center text-[11px]">Qty</div>
                  <div class="col-span-4 text-right text-[11px]">Subtotal</div>
                </div>
                <div v-for="item in notes" :key="item.label" class="grid grid-cols-12 px-4 py-3.5 items-center group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                  <div class="col-span-3">
                    <div class="inline-flex items-center justify-center min-w-[60px] px-3 py-2 font-bold text-sm text-green-500">{{ item.label }}</div>
                  </div>
                  <div class="col-span-5 flex justify-center">
                    <div class="flex items-center gap-1.5 bg-muted p-1 border border-border">
                      <button @click="updateCount(item.label, -1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted text-muted-foreground transition-all active:scale-90"><Minus class="w-4 h-4" /></button>
                      <input type="number" :value="counts[item.label] || ''" placeholder="0" @input="onQty(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-12 text-center font-bold text-foreground bg-transparent border-none focus:ring-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button @click="updateCount(item.label, 1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted text-muted-foreground transition-all active:scale-90"><Plus class="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div class="col-span-4 flex justify-end">
                    <div class="relative w-28">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{{ currency }}</span>
                      <input type="number" :step="item.value" :value="subtotalOf(item) || ''" placeholder="0.00" @input="onSubtotal(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-full bg-input border border-border py-2.5 pl-6 pr-3 font-bold text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all text-sm text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coins -->
            <div class="bg-card border border-border shadow-sm flex flex-col overflow-hidden">
              <div class="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Coins class="w-3.5 h-3.5 text-amber-500" />
                  Coins
                </span>
                <span class="text-sm font-bold">{{ currency }}{{ coinsTotal.toFixed(2) }}</span>
              </div>
              <div class="overflow-y-auto flex-1">
                <div class="grid grid-cols-12 px-4 py-2 bg-muted/50 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div class="col-span-3 text-[11px]">Unit</div>
                  <div class="col-span-5 text-center text-[11px]">Qty</div>
                  <div class="col-span-4 text-right text-[11px]">Subtotal</div>
                </div>
                <div v-for="item in coins" :key="item.label" class="grid grid-cols-12 px-4 py-3.5 items-center group hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                  <div class="col-span-3">
                    <div class="inline-flex items-center justify-center min-w-[60px] px-3 py-2 font-bold text-sm text-amber-500">{{ item.label }}</div>
                  </div>
                  <div class="col-span-5 flex justify-center">
                    <div class="flex items-center gap-1.5 bg-muted p-1 border border-border">
                      <button @click="updateCount(item.label, -1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted text-muted-foreground transition-all active:scale-90"><Minus class="w-4 h-4" /></button>
                      <input type="number" :value="counts[item.label] || ''" placeholder="0" @input="onQty(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-12 text-center font-bold text-foreground bg-transparent border-none focus:ring-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button @click="updateCount(item.label, 1)" class="w-9 h-9 flex items-center justify-center bg-card shadow-sm hover:bg-muted text-muted-foreground transition-all active:scale-90"><Plus class="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div class="col-span-4 flex justify-end">
                    <div class="relative w-28">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{{ currency }}</span>
                      <input type="number" :step="item.value" :value="subtotalOf(item) || ''" placeholder="0.00" @input="onSubtotal(item.label, ($event.target as HTMLInputElement).value, item.value)" class="w-full bg-input border border-border py-2.5 pl-6 pr-3 font-bold text-foreground focus:ring-2 focus:ring-primary focus:bg-card transition-all text-sm text-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="col-span-3 flex flex-col space-y-4 overflow-hidden">
          <div class="flex-1 overflow-y-auto space-y-4 pr-1">
            <!-- Card Payments -->
            <section class="bg-card border border-border shadow-sm p-5 space-y-4">
              <div class="flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-blue-500" />
                <h2 class="font-bold text-xs uppercase tracking-wider text-muted-foreground">Card Payments</h2>
              </div>
              <div class="space-y-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-muted-foreground uppercase ml-1">Takings</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{{ currency }}</span>
                    <input type="number" v-model="cardAmount" class="w-full bg-input border border-border py-2.5 pl-6 pr-3 font-bold text-base focus:ring-2 focus:ring-primary transition-all text-foreground" placeholder="0.00" />
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] font-bold uppercase ml-1 text-destructive">Refunds</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{{ currency }}</span>
                    <input type="number" v-model="cardRefunds" class="w-full bg-input border border-border py-2.5 pl-6 pr-3 font-bold text-base text-destructive focus:ring-2 focus:ring-destructive transition-all" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </section>

            <!-- Other payments -->
            <section class="bg-card border border-border shadow-sm overflow-hidden">
              <button @click="isOtherExpanded = !isOtherExpanded" class="w-full px-5 py-3 flex items-center justify-between hover:bg-muted transition-colors">
                <div class="flex items-center gap-2">
                  <Wallet class="w-4 h-4 text-purple-500" />
                  <h2 class="font-bold text-xs uppercase tracking-wider text-muted-foreground">Other</h2>
                </div>
                <component :is="isOtherExpanded ? ChevronUp : ChevronDown" class="w-4 h-4" />
              </button>
              <div v-if="isOtherExpanded" class="px-5 pb-5 space-y-3 border-t border-border pt-3">
                <div v-for="method in otherMethods" :key="method.id" class="space-y-1">
                  <label class="text-[9px] font-bold text-muted-foreground uppercase ml-1">{{ method.label }}</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[10px]">{{ currency }}</span>
                    <input type="number" v-model="otherPayments[method.id]" class="w-full bg-input border border-border py-2 pl-6 pr-2 font-bold text-xs focus:ring-2 focus:ring-primary transition-all text-foreground" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </section>

            <!-- Close details / override -->
            <section class="bg-card border border-border shadow-sm p-5 space-y-3">
              <div class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Close Details</div>
              <div v-if="errorMsg" class="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2">{{ errorMsg }}</div>
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-muted-foreground uppercase ml-1">Closed by *</label>
                <input v-model="closedBy" class="w-full bg-input border border-border py-2.5 px-3 font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-foreground" placeholder="Staff name" />
              </div>
              <div v-if="needsOverride" class="space-y-2 pt-1">
                <div class="flex items-center gap-2 text-destructive text-xs font-semibold"><AlertTriangle class="w-4 h-4" /> Manager approval required</div>
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-muted-foreground uppercase ml-1">Manager tag *</label>
                  <input v-model="managerTag" class="w-full bg-input border border-border py-2 px-3 text-sm focus:ring-2 focus:ring-primary transition-all text-foreground" placeholder="Manager name / ID" />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-muted-foreground uppercase ml-1">Reason *</label>
                  <textarea v-model="reason" rows="2" class="w-full bg-input border border-border py-2 px-3 text-sm focus:ring-2 focus:ring-primary transition-all text-foreground resize-none" placeholder="Explain the variance"></textarea>
                </div>
              </div>
            </section>
          </div>

          <!-- Summary -->
          <section class="bg-card border border-border p-5 shadow-xl shrink-0 space-y-4">
            <div class="space-y-3">
              <div class="flex justify-between items-center text-[13px]">
                <span class="font-bold text-muted-foreground uppercase tracking-widest">Main Net</span>
                <span class="font-bold text-foreground">{{ currency }}{{ mainNet.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center text-[13px]">
                <span class="font-bold text-muted-foreground uppercase tracking-widest">Others</span>
                <span class="font-bold text-foreground">{{ currency }}{{ totalOther.toFixed(2) }}</span>
              </div>
              <div class="h-px bg-border" />
              <div class="space-y-1">
                <p class="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Declared (Cash)</p>
                <p class="text-3xl font-black tracking-tight text-foreground">{{ currency }}{{ totalDeclared.toFixed(2) }}</p>
                <p :class="['text-[10px] font-bold uppercase tracking-widest pt-1', hasVariance ? 'text-destructive' : 'text-green-500']">
                  {{ hasVariance ? `${currency}${variance.toFixed(2)} Variance` : 'Register Balanced' }}
                </p>
              </div>
            </div>

            <button
              @click="confirmClose"
              :disabled="!till"
              class="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 bg-primary text-primary-foreground hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              Close Banking
              <ArrowRight class="w-4 h-4" />
            </button>
          </section>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="showClearDialog"
      title="Clear All Counts"
      message="Are you sure you want to clear all counts and inputs? This will reset every entry you have made."
      confirm-label="Clear All"
      :danger="true"
      @cancel="showClearDialog = false"
      @confirm="handleClearAll"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ChevronLeft, AlertTriangle, CheckCircle2, Banknote, Coins, Trash2, Plus, Minus, CreditCard, Wallet, ChevronDown, ChevronUp, ArrowRight } from 'lucide-vue-next'
import { useStore } from '@/store/useStore'
import { tillExpectedCash } from '@/utils/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Till, Sale } from '@/types'

const props = defineProps<{ till: Till | undefined; sales: Sale[]; currency: string }>()
const emit = defineEmits<{ close: []; complete: [] }>()

const store = useStore()

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

const otherMethods = [
  { id: 'paypal_out', label: 'PayPal Out' },
  { id: 'fps', label: 'FPS' },
  { id: 'bitcoin', label: 'Bitcoin' },
  { id: 'bitcoin_out', label: 'Bitcoin Out' },
  { id: 'datacash', label: 'DataCash' },
  { id: 'datacash_refund', label: 'DataCash Refund' },
  { id: 'authorize_net', label: 'Authorize.net' },
] as const

const counts = reactive<Record<string, number>>(Object.fromEntries(DENOMS.map(d => [d.label, 0])))
const cardAmount = ref('')
const cardRefunds = ref('')
const otherPayments = reactive<Record<string, string>>(Object.fromEntries(otherMethods.map(m => [m.id, ''])))
const isOtherExpanded = ref(false)
const showClearDialog = ref(false)

const closedBy = ref('')
const managerTag = ref('')
const reason = ref('')
const errorMsg = ref('')

const notes = computed(() => DENOMS.filter(d => d.type === 'note'))
const coins = computed(() => DENOMS.filter(d => d.type === 'coin'))

const expected = computed(() => props.till ? tillExpectedCash(props.till, props.sales) : 0)

function subtotalOf(item: { label: string; value: number }) {
  return Math.round((counts[item.label] || 0) * item.value * 100) / 100
}

const notesTotal = computed(() => notes.value.reduce((s, d) => s + (counts[d.label] || 0) * d.value, 0))
const coinsTotal = computed(() => coins.value.reduce((s, d) => s + (counts[d.label] || 0) * d.value, 0))
const totalDeclared = computed(() => Math.round((notesTotal.value + coinsTotal.value) * 100) / 100)
const variance = computed(() => Math.round((totalDeclared.value - expected.value) * 100) / 100)
const hasVariance = computed(() => Math.abs(variance.value) >= 0.01)
const needsOverride = hasVariance

const totalOther = computed(() => Object.values(otherPayments).reduce((sum, val) => sum + (parseFloat(val) || 0), 0))
const mainNet = computed(() => totalDeclared.value + (parseFloat(cardAmount.value) || 0) - (parseFloat(cardRefunds.value) || 0))

const todayLabel = computed(() => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

function updateCount(label: string, delta: number) {
  counts[label] = Math.max(0, (counts[label] || 0) + delta)
}
function onQty(label: string, value: string, _denValue: number) {
  const n = parseInt(value, 10)
  counts[label] = Number.isFinite(n) && n > 0 ? n : 0
}
function onSubtotal(label: string, value: string, denValue: number) {
  const subtotal = parseFloat(value) || 0
  const qty = Math.floor((subtotal + 1e-9) / denValue)
  counts[label] = Math.max(0, qty)
}

function handleClearAll() {
  for (const d of DENOMS) counts[d.label] = 0
  cardAmount.value = ''
  cardRefunds.value = ''
  for (const m of otherMethods) otherPayments[m.id] = ''
  showClearDialog.value = false
}

watch([() => props.till?.id, totalDeclared, variance], () => {
  if (!props.till) return
  store.setBankingContext({
    tillId: props.till.id,
    tillName: props.till.name,
    expectedCash: expected.value,
    countedCash: totalDeclared.value,
    variance: variance.value,
    openedAt: props.till.openedAt ?? Date.now(),
    openingFloat: props.till.openingFloat,
    currency: props.currency,
  })
}, { immediate: true })

onBeforeUnmount(() => store.setBankingContext(null))

function confirmClose() {
  errorMsg.value = ''
  if (!props.till) return
  if (!closedBy.value.trim()) { errorMsg.value = 'Enter the staff member closing banking'; return }
  if (needsOverride.value && (!managerTag.value.trim() || !reason.value.trim())) {
    errorMsg.value = "Cash doesn't tally — manager tag and reason are required"; return
  }
  const res = store.closeTill(props.till.id, {
    countedCash: totalDeclared.value,
    closedBy: closedBy.value.trim(),
    managerTag: needsOverride.value ? managerTag.value.trim() : undefined,
    shortageReason: needsOverride.value ? reason.value.trim() : undefined,
  })
  if (!res.ok) { errorMsg.value = res.error || 'Could not close till'; return }
  emit('complete')
}
</script>
