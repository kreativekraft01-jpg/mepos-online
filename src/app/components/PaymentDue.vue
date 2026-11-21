<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 z-[220]">
        <!-- Success Overlay -->
        <div v-if="isSuccess" class="fixed inset-0 z-[230] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div class="bg-[#161A1E] border border-primary/50 p-8 rounded-lg flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-sm w-full mx-4">
            <div class="relative">
              <div class="w-20 h-20 rounded-full bg-primary flex items-center justify-center relative z-10">
                <Check class="w-10 h-10 text-black stroke-[3]" />
              </div>
              <div class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
            </div>
            <div class="text-center space-y-2">
              <h2 class="text-2xl font-black text-white uppercase tracking-wider">Payment Successful</h2>
              <div class="text-primary font-mono text-3xl font-bold">£{{ totalPaid.toFixed(2) }}</div>
              <p class="text-neutral-400 text-xs">Change Due: £{{ change.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Backdrop -->
        <div class="fixed inset-0 bg-transparent z-[220]" @click="!isSuccess && $emit('close')"></div>

        <!-- Side Sheet -->
        <div class="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-background border-l border-border shadow-2xl z-[221] flex flex-col" @click.stop>
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-border px-[24px] py-[12px]">
            <h2 class="text-xl font-bold text-foreground uppercase tracking-wider">Payment Due</h2>
            <button @click="$emit('close')" :disabled="isSuccess" class="p-2 hover:bg-card text-neutral-400 hover:text-foreground transition-colors disabled:opacity-50">
              <X class="w-6 h-6" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <!-- Payment Methods -->
            <div class="p-6">
              <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Select Method (Max 3)</h3>
              <div class="flex overflow-x-auto gap-3 pb-[16px] -mx-6 px-[24px] no-scrollbar touch-pan-x pt-[8px]">
                <button
                  v-for="method in paymentMethodsConfig"
                  :key="method.id"
                  @click="handleMethodToggle(method.id)"
                  :disabled="(!isSelected(method.id) && selectedMethods.length >= 3) || isSuccess"
                  :class="[
                    'flex-shrink-0 w-28 h-28 flex flex-col items-center justify-center gap-3 border-2 transition-all',
                    isSelected(method.id)
                      ? `${method.bg} ${method.activeBorder} shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105`
                      : 'bg-card border-transparent hover:border-border opacity-80 hover:opacity-100',
                    ((!isSelected(method.id) && selectedMethods.length >= 3) || isSuccess) ? 'opacity-30 cursor-not-allowed' : ''
                  ]"
                >
                  <component :is="method.icon" :class="['w-8 h-8', isSelected(method.id) ? method.color : 'text-neutral-400']" />
                  <span :class="['text-xs font-bold uppercase tracking-wider', isSelected(method.id) ? 'text-foreground' : 'text-neutral-400']">{{ method.label }}</span>
                </button>
              </div>
            </div>

            <!-- Allocation -->
            <div v-if="selectedMethods.length > 0" class="px-6 pb-6">
              <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Allocation</h3>
              <div class="space-y-3">
                <div v-for="method in selectedMethods" :key="method" class="flex items-center gap-3 bg-card p-1 pr-4 border border-border">
                  <div :class="['p-3 border-r border-border', configOf(method).bg]">
                    <component :is="configOf(method).icon" :class="['w-5 h-5', configOf(method).color]" />
                  </div>
                  <div class="flex-1 font-medium text-sm text-neutral-300">{{ configOf(method).label }}</div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">£</span>
                    <div class="flex items-center bg-background border border-border">
                      <button @click="stepAmount(method, -1)" :disabled="isSuccess" class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-card transition-colors border-r border-border disabled:opacity-50">
                        <Minus class="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        :disabled="isSuccess"
                        :value="paymentAmounts[method] ?? ''"
                        @input="onAmountInput(method, ($event.target as HTMLInputElement).value)"
                        @blur="onAmountBlur(method)"
                        @keydown.up.prevent="stepAmount(method, 1)"
                        @keydown.down.prevent="stepAmount(method, -1)"
                        class="w-20 bg-transparent text-center font-semibold text-[#F1F5F9] focus:outline-none placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                        placeholder="0.00"
                      />
                      <button @click="stepAmount(method, 1)" :disabled="isSuccess" class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-card transition-colors border-l border-border disabled:opacity-50">
                        <Plus class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-card border-t border-border space-y-6 pt-[18px] pr-[24px] pb-[24px] pl-[24px]">
            <!-- Receipt Options -->
            <div class="flex items-center justify-between gap-2">
              <label @click="!isSuccess && (printReceipt = !printReceipt)" class="flex items-center gap-3 cursor-pointer group flex-1 select-none">
                <div :class="['w-5 h-5 border-2 flex items-center justify-center transition-colors', printReceipt ? 'bg-primary border-primary' : 'border-border group-hover:border-primary']">
                  <Check v-if="printReceipt" class="w-3.5 h-3.5 text-primary-foreground" :stroke-width="3" />
                </div>
                <span class="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">Print</span>
              </label>
              <label @click="!isSuccess && (emailReceipt = !emailReceipt)" class="flex items-center gap-3 cursor-pointer group flex-1 select-none">
                <div :class="['w-5 h-5 border-2 flex items-center justify-center transition-colors', emailReceipt ? 'bg-primary border-primary' : 'border-border group-hover:border-primary']">
                  <Check v-if="emailReceipt" class="w-3.5 h-3.5 text-primary-foreground" :stroke-width="3" />
                </div>
                <span class="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">Email</span>
              </label>
              <label @click="!isSuccess && (giftReceipt = !giftReceipt)" class="flex items-center gap-3 cursor-pointer group flex-1 select-none">
                <div :class="['w-5 h-5 border-2 flex items-center justify-center transition-colors', giftReceipt ? 'bg-primary border-primary' : 'border-border group-hover:border-primary']">
                  <Check v-if="giftReceipt" class="w-3.5 h-3.5 text-primary-foreground" :stroke-width="3" />
                </div>
                <span class="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">Gift</span>
              </label>
            </div>

            <!-- Dropdowns -->
            <div :class="['grid gap-4', selectedMethods.includes('card') ? 'grid-cols-2' : 'grid-cols-1']">
              <div v-if="selectedMethods.includes('card')" class="space-y-1">
                <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">PDQ Terminal</label>
                <div class="relative">
                  <select :disabled="isSuccess" v-model="selectedPDQ" class="w-full bg-card border border-border text-foreground text-sm p-2.5 pr-10 focus:outline-none focus:border-primary disabled:opacity-50 appearance-none">
                    <option value="pdq1">Terminal 1</option>
                    <option value="pdq2">Terminal 2</option>
                    <option value="pdq3">Terminal 3</option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronDown class="w-4 h-4" /></div>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Source</label>
                <div class="relative">
                  <select :disabled="isSuccess" v-model="sourceOfSale" class="w-full bg-card border border-border text-foreground text-sm p-2.5 pr-10 focus:outline-none focus:border-primary disabled:opacity-50 appearance-none">
                    <option value="in-store">In Store</option>
                    <option value="online">Online</option>
                    <option value="phone">Phone</option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronDown class="w-4 h-4" /></div>
                </div>
              </div>
            </div>

            <!-- CTA & Totals -->
            <div class="space-y-3 mt-4">
              <div class="flex items-stretch gap-0 h-24 shadow-lg shadow-black/20 overflow-hidden border border-border">
                <div class="flex-1 bg-card p-4 flex flex-col justify-center gap-2 min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">{{ isPayout ? 'Payout' : 'Total' }}</span>
                    <span class="text-lg font-bold text-foreground tabular-nums">£{{ (isPayout ? absTotal : total).toFixed(2) }}</span>
                  </div>
                  <div v-if="totalPaid > 0" class="flex items-baseline justify-between gap-2 opacity-60">
                    <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">{{ isPayout ? 'We Pay' : 'Paid' }}</span>
                    <span class="text-xs font-bold text-muted-foreground tabular-nums">£{{ totalPaid.toFixed(2) }}</span>
                  </div>
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">{{ remaining > 0 ? (isPayout ? 'To Pay Customer' : 'To Pay') : change > 0 ? 'Change' : 'Balance' }}</span>
                    <span :class="['text-2xl font-bold tabular-nums', remaining > 0 ? 'text-primary' : 'text-[#34D399]']">£{{ remaining > 0 ? remaining.toFixed(2) : change > 0 ? change.toFixed(2) : '0.00' }}</span>
                  </div>
                </div>
                <button :disabled="!isFullyPaid || isSuccess" @click="handleCompleteTransaction" class="flex-[1.2] bg-primary hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold uppercase tracking-wider text-lg transition-all active:scale-[0.99] flex flex-col items-center justify-center gap-2 leading-none disabled:shadow-none border-l-2 border-primary-foreground/10">
                  <span class="text-xl">{{ isPayout ? 'Pay Out' : 'Process' }}</span>
                  <kbd v-if="isFullyPaid && !isSuccess" class="px-2.5 py-1 bg-black/20 border border-primary-foreground/20 text-xs font-mono text-primary-foreground font-semibold shadow-sm">Enter</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { X, Check, ChevronDown, Minus, Plus, Banknote, CreditCard, FileText, Ticket, Smartphone, Building2, Gift } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import confetti from 'canvas-confetti'
import { useSound } from '../hooks/useSound'
import type { PaymentMethod, PaymentSplit } from '../../types'

const props = defineProps<{
  isOpen: boolean
  total: number
  sellTotal: number
  buyTotal: number
  exchangeTotal: number
}>()
const emit = defineEmits<{ close: []; complete: [payments: PaymentSplit[]] }>()

const { playSuccess } = useSound()

const paymentMethodsConfig = [
  { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote, color: 'text-[#34D399]', bg: 'bg-[#34D399]/5', border: 'border-[#34D399]/10', activeBorder: 'border-[#34D399]' },
  { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard, color: 'text-[#60A5FA]', bg: 'bg-[#60A5FA]/5', border: 'border-[#60A5FA]/10', activeBorder: 'border-[#60A5FA]' },
  { id: 'voucher' as PaymentMethod, label: 'Voucher', icon: Ticket, color: 'text-[#FB923C]', bg: 'bg-[#FB923C]/5', border: 'border-[#FB923C]/10', activeBorder: 'border-[#FB923C]' },
  { id: 'cheque' as PaymentMethod, label: 'Cheque', icon: FileText, color: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/5', border: 'border-[#94A3B8]/10', activeBorder: 'border-[#94A3B8]' },
  { id: 'upi' as PaymentMethod, label: 'UPI', icon: Smartphone, color: 'text-[#A78BFA]', bg: 'bg-[#A78BFA]/5', border: 'border-[#A78BFA]/10', activeBorder: 'border-[#A78BFA]' },
  { id: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer', icon: Building2, color: 'text-[#818CF8]', bg: 'bg-[#818CF8]/5', border: 'border-[#818CF8]/10', activeBorder: 'border-[#818CF8]' },
  { id: 'gift_card' as PaymentMethod, label: 'Gift Card', icon: Gift, color: 'text-[#FB7185]', bg: 'bg-[#FB7185]/5', border: 'border-[#FB7185]/10', activeBorder: 'border-[#FB7185]' },
]

const selectedMethods = ref<PaymentMethod[]>([])
const paymentAmounts = reactive<Record<string, string>>({})
const emailReceipt = ref(false)
const printReceipt = ref(true)
const giftReceipt = ref(false)
const selectedPDQ = ref('pdq1')
const sourceOfSale = ref('in-store')
const isSuccess = ref(false)
let successTimer: any = null

const round2 = (n: number) => Math.round(n * 100) / 100
const amountOf = (m: PaymentMethod) => parseFloat(paymentAmounts[m] || '0') || 0

const isPayout = computed(() => props.total < -0.005)
const absTotal = computed(() => Math.abs(props.total))
const payoutDue = computed(() => isPayout.value ? absTotal.value : 0)
const effectiveTotal = computed(() => isPayout.value ? absTotal.value : Math.max(0, props.total))
const totalPaid = computed(() => selectedMethods.value.reduce((sum, method) => sum + amountOf(method), 0))
const remaining = computed(() => isPayout.value ? Math.max(0, payoutDue.value - totalPaid.value) : Math.max(0, props.total - totalPaid.value))
const change = computed(() => !isPayout.value && totalPaid.value > props.total ? totalPaid.value - props.total : 0)
const isFullyPaid = computed(() => isPayout.value ? totalPaid.value >= payoutDue.value - 0.001 : props.total === 0 ? true : totalPaid.value >= props.total - 0.001)

function configOf(m: PaymentMethod) { return paymentMethodsConfig.find(x => x.id === m)! }
function isSelected(m: PaymentMethod) { return selectedMethods.value.includes(m) }

function distributeTarget(methods: PaymentMethod[], targetRaw: number, current: (m: PaymentMethod) => number): Partial<Record<PaymentMethod, number>> {
  const target = Math.max(0, round2(targetRaw))
  const out: Partial<Record<PaymentMethod, number>> = {}
  if (methods.length === 0) return out
  const curSum = methods.reduce((s, m) => s + current(m), 0)
  const shares = methods.map((m) => {
    const cur = current(m)
    if (curSum > 0 && target < curSum) return Math.floor(target * (cur / curSum) * 100) / 100
    if (curSum > 0) {
      const surplus = target - curSum
      return Math.floor((cur + surplus / methods.length) * 100) / 100
    }
    return Math.floor((target / methods.length) * 100) / 100
  })
  let assigned = shares.reduce((s, v) => s + v, 0)
  let remainder = Math.round((target - assigned) * 100)
  for (let i = 0; remainder > 0 && i < shares.length; i++) { shares[i] = round2(shares[i] + 0.01); remainder -= 1 }
  methods.forEach((m, i) => { out[m] = shares[i] })
  return out
}

function resetState() {
  selectedMethods.value = []
  for (const k of Object.keys(paymentAmounts)) delete paymentAmounts[k]
  emailReceipt.value = false
  printReceipt.value = true
  giftReceipt.value = false
  selectedPDQ.value = 'pdq1'
  sourceOfSale.value = 'in-store'
  isSuccess.value = false
}

watch(() => props.isOpen, (v) => { if (v) resetState() })

function handleMethodToggle(method: PaymentMethod) {
  if (isSuccess.value) return
  if (selectedMethods.value.includes(method)) {
    const removedAmount = amountOf(method)
    const rest = selectedMethods.value.filter(m => m !== method)
    const next: Record<string, string> = { ...paymentAmounts }
    delete next[method]
    if (rest.length > 0 && removedAmount > 0) {
      const totalForRest = rest.reduce((s, m) => s + amountOf(m), 0) + removedAmount
      const split = distributeTarget(rest, totalForRest, (m) => amountOf(m))
      rest.forEach(m => { next[m] = (split[m] ?? 0).toFixed(2) })
    }
    selectedMethods.value = rest
    for (const k of Object.keys(paymentAmounts)) delete paymentAmounts[k]
    Object.assign(paymentAmounts, next)
    return
  }
  if (selectedMethods.value.length >= 3) return
  const currentTotal = Object.values(paymentAmounts).reduce((sum, amt) => sum + parseFloat(amt || '0'), 0)
  const remainingAmount = Math.max(0, effectiveTotal.value - currentTotal)
  selectedMethods.value = [...selectedMethods.value, method]
  paymentAmounts[method] = remainingAmount.toFixed(2)
}

function onAmountInput(method: PaymentMethod, value: string) {
  const raw = parseFloat(value)
  if (!Number.isFinite(raw)) {
    paymentAmounts[method] = value
    return
  }
  const next = Math.max(0, raw)
  const others = selectedMethods.value.filter(m => m !== method)
  const maxTotal = effectiveTotal.value
  if (others.length === 0) {
    paymentAmounts[method] = value
    return
  }
  const clamped = Math.min(next, maxTotal)
  const split = distributeTarget(others, maxTotal - clamped, (m) => amountOf(m))
  const nextAmounts: Record<string, string> = { ...paymentAmounts, [method]: value }
  Object.entries(split).forEach(([m, v]) => { nextAmounts[m] = (v ?? 0).toFixed(2) })
  for (const k of Object.keys(paymentAmounts)) delete paymentAmounts[k]
  Object.assign(paymentAmounts, nextAmounts)
}

function onAmountBlur(method: PaymentMethod) {
  const n = parseFloat(paymentAmounts[method] || '')
  if (!Number.isFinite(n)) {
    onAmountInput(method, '0')
  } else {
    onAmountInput(method, Math.min(n, effectiveTotal.value).toFixed(2))
  }
}

function stepAmount(method: PaymentMethod, delta: number) {
  const current = amountOf(method)
  const newVal = Math.max(0, current + delta)
  onAmountInput(method, newVal.toFixed(2))
}

function handleCompleteTransaction() {
  if (!isFullyPaid.value || isSuccess.value) return
  isSuccess.value = true
  playSuccess()
  toast.success('Payment processed successfully!')
  try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } }) } catch {}
  successTimer = setTimeout(() => {
    const maxTotal = effectiveTotal.value
    let payments: PaymentSplit[] = selectedMethods.value.map(m => ({
      method: m,
      amount: Math.round(Math.min(amountOf(m), maxTotal) * 100) / 100,
    })).filter(p => p.amount > 0)
    if (payments.length === 0 && props.total === 0) payments = [{ method: 'cash', amount: 0 }]
    emit('complete', payments)
  }, 1500)
}

function onKey(e: KeyboardEvent) {
  if (!props.isOpen) return
  const target = e.target as HTMLElement | null
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return
  if (e.key === 'Enter' && isFullyPaid.value && !isSuccess.value) {
    e.preventDefault()
    handleCompleteTransaction()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); if (successTimer) clearTimeout(successTimer) })
</script>
