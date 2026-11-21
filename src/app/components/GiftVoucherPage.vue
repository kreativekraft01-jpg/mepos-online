<template>
  <div class="flex flex-col h-full bg-background animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden relative">
    <!-- Success Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isSuccess" class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div class="bg-card border border-primary/50 p-8 rounded-lg flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(204,117,73,0.25)] max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
          <div class="relative">
            <div class="w-20 h-20 rounded-full bg-primary flex items-center justify-center relative z-10">
              <Check class="w-10 h-10 text-primary-foreground stroke-[3]" />
            </div>
            <div class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
          </div>
          <div class="text-center space-y-2">
            <h2 class="text-2xl font-black text-foreground uppercase tracking-wider">Payment Successful</h2>
            <div class="text-primary font-mono text-3xl font-bold">{{ currency }}{{ parsedAmount.toFixed(2) }}</div>
            <p class="text-muted-foreground text-xs">Receipt sent to {{ successEmail }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex items-center gap-4 p-4 border-b border-border bg-card shrink-0">
      <button @click="onBack" class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors" title="Back (Esc)">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div class="flex items-center gap-6">
        <h1 class="text-lg font-black text-foreground uppercase tracking-wider">Gift Voucher</h1>
        <div class="h-5 w-px bg-border" />
        <div class="text-xs text-muted-foreground font-mono">Issue New Voucher</div>
      </div>
    </div>

    <div class="flex-1 p-5 overflow-hidden min-h-0">
      <div class="w-full h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Details -->
        <div class="lg:col-span-7 flex flex-col gap-5 h-full min-h-0">
          <!-- Amount -->
          <div class="bg-card border border-border p-5 shrink-0">
            <h2 class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Voucher Value</h2>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">{{ currency }}</span>
              <input
                ref="amountInput"
                type="number"
                min="0"
                step="0.01"
                v-model="amount"
                placeholder="0.00"
                class="w-full h-12 pl-10 bg-background border border-border text-foreground text-2xl font-mono font-bold focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <!-- Customer & Receipt -->
          <div class="bg-card border border-border flex-1 flex flex-col min-h-0 overflow-hidden">
            <!-- Customer -->
            <div class="flex-1 flex flex-col min-h-0 p-5 overflow-hidden">
              <div class="flex justify-between items-center mb-4 shrink-0">
                <h2 class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Customer Details</h2>
                <div class="flex bg-muted p-1 border border-border">
                  <button @click="customerMode = 'guest'" :class="['px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors', customerMode === 'guest' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">Guest</button>
                  <button @click="customerMode = 'existing'" :class="['px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors', customerMode === 'existing' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">Registered</button>
                </div>
              </div>

              <div class="overflow-y-auto min-h-0 flex flex-col justify-center">
                <div v-if="customerMode === 'guest'" class="space-y-4">
                  <div>
                    <label class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Guest Email</label>
                    <div class="relative">
                      <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="email" v-model="guestEmail" placeholder="customer@example.com" class="w-full h-10 pl-10 pr-4 bg-background border border-border text-foreground text-sm focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                <div v-else class="space-y-3 h-full flex flex-col">
                  <div v-if="selectedCustomer" class="bg-background border border-primary/30 p-4 flex items-center justify-between group mt-auto mb-auto">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg rounded-sm shrink-0">{{ selectedCustomer.name.charAt(0) }}</div>
                      <div class="min-w-0">
                        <div class="font-bold text-foreground text-sm truncate">{{ selectedCustomer.name }}</div>
                        <div class="text-[10px] text-muted-foreground truncate">{{ selectedCustomer.email || selectedCustomer.phone }}</div>
                      </div>
                    </div>
                    <button @click="$emit('activate-customer-search')" class="text-[10px] text-primary hover:brightness-110 font-bold uppercase tracking-wider shrink-0 ml-2">Change</button>
                  </div>
                  <div v-else class="grid grid-cols-2 gap-3 h-full">
                    <button @click="$emit('activate-customer-search')" class="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-border hover:border-primary hover:bg-muted/40 transition-all group h-full">
                      <Search class="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground text-center">Search Customer</span>
                    </button>
                    <button @click="$emit('new-customer')" class="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-border hover:border-primary hover:bg-muted/40 transition-all group h-full">
                      <UserPlus class="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground text-center">Create New</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="h-px bg-border w-full shrink-0" />

            <!-- Receipt -->
            <div class="p-5 shrink-0 bg-card">
              <h2 class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Receipt & Delivery</h2>
              <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-3 p-3 bg-background border border-border cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <div :class="['w-4 h-4 border flex items-center justify-center', receiptOptions.print ? 'bg-primary border-primary' : 'border-muted-foreground']">
                    <Check v-if="receiptOptions.print" class="w-3 h-3 text-primary-foreground" />
                  </div>
                  <input type="checkbox" class="hidden" v-model="receiptOptions.print" />
                  <span class="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><Printer class="w-3.5 h-3.5" /> Print Receipt</span>
                </label>
                <label class="flex items-center gap-3 p-3 bg-background border border-border cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <div :class="['w-4 h-4 border flex items-center justify-center', receiptOptions.email ? 'bg-primary border-primary' : 'border-muted-foreground']">
                    <Check v-if="receiptOptions.email" class="w-3 h-3 text-primary-foreground" />
                  </div>
                  <input type="checkbox" class="hidden" v-model="receiptOptions.email" />
                  <span class="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><Mail class="w-3.5 h-3.5" /> Email Receipt</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Payment -->
        <div class="lg:col-span-5 flex flex-col h-full bg-card border border-border overflow-hidden">
          <div class="p-5 flex-1 flex flex-col min-h-0">
            <h2 class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Payment Method</h2>
            <div class="grid grid-cols-2 gap-2 flex-1 min-h-0 mb-4 overflow-y-auto content-start">
              <button
                v-for="m in paymentMethods"
                :key="m.id"
                @click="paymentMethod = m.id"
                :class="['flex flex-col items-center justify-center p-2 border transition-all relative overflow-hidden group gap-1.5 h-full min-h-[4rem]', paymentMethod === m.id ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_20px_rgba(204,117,73,0.2)]' : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground']"
              >
                <component :is="m.icon" :class="['w-5 h-5', paymentMethod === m.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground']" />
                <span :class="['text-[9px] font-bold uppercase tracking-wider text-center leading-tight', paymentMethod === m.id ? 'text-primary-foreground' : 'text-foreground']">{{ m.label }}</span>
                <div v-if="paymentMethod === m.id" class="absolute top-1 right-1">
                  <CheckCircle class="w-3 h-3" />
                </div>
              </button>
            </div>

            <div class="shrink-0">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Select PDQ Terminal</label>
              <select v-model="pdq" class="w-full h-10 px-3 bg-background border border-border text-foreground text-sm focus:border-primary focus:outline-none transition-colors">
                <option>PDQ 1</option>
                <option>PDQ 2</option>
                <option>PDQ 3</option>
              </select>
            </div>
          </div>

          <div class="p-5 border-t border-border bg-card shrink-0 mt-auto">
            <button
              @click="handleProcess"
              :disabled="!canProcess"
              class="w-full h-14 bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-base transition-colors shadow-lg flex items-center justify-between px-6 rounded-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
            >
              <span class="flex items-center gap-2"><Lock class="w-4 h-4" /> Process Payment</span>
              <span class="font-mono text-xl bg-black/10 px-4 py-1 rounded">{{ currency }}{{ parsedAmount.toFixed(2) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ArrowLeft, Wallet, CreditCard, Ticket, Bitcoin, Terminal, ShieldCheck, Landmark, ShoppingCart, Printer, Check, CheckCircle, Mail, UserPlus, Search, Lock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import confetti from 'canvas-confetti'
import { useStore } from '@/store/useStore'
import type { CustomerResult } from './SearchResultsTypes'

const props = defineProps<{ selectedCustomer: CustomerResult | null }>()
const emit = defineEmits<{
  back: []
  'activate-customer-search': []
  'new-customer': []
  process: [details: any]
}>()

const store = useStore()
const currency = computed(() => store.settings.currency || '£')

const amount = ref<string>('')
const amountInput = ref<HTMLInputElement | null>(null)
const customerMode = ref<'guest' | 'existing'>(props.selectedCustomer ? 'existing' : 'guest')
const guestEmail = ref('')
const paymentMethod = ref('card')
const pdq = ref('PDQ 1')
const receiptOptions = reactive({ print: true, email: false })
const isSuccess = ref(false)
let successTimer: any = null
let confettiInterval: any = null

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'voucher', label: 'Voucher', icon: Ticket },
  { id: 'bitcoin', label: 'Bitcoin', icon: Bitcoin },
  { id: 'datacash', label: 'Datacash', icon: Terminal },
  { id: 'authorizenet', label: 'Authorize.Net', icon: ShieldCheck },
  { id: 'lacaixa', label: 'LaCaixa', icon: Landmark },
  { id: 'ebay', label: 'eBay', icon: ShoppingCart },
]

const parsedAmount = computed(() => {
  const n = parseFloat(amount.value)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0
})

const successEmail = computed(() => {
  if (customerMode.value === 'guest') return guestEmail.value
  return props.selectedCustomer?.email || props.selectedCustomer?.name || 'customer'
})

const canProcess = computed(() => {
  if (!(parsedAmount.value > 0)) return false
  if (customerMode.value === 'guest') return !!guestEmail.value.trim()
  return !!props.selectedCustomer
})

watch(() => props.selectedCustomer, (c) => {
  if (c) customerMode.value = 'existing'
})

function onBack() {
  if (isSuccess.value) return
  emit('back')
}

function startConfetti() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }
  const random = (min: number, max: number) => Math.random() * (max - min) + min
  confettiInterval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()
    if (timeLeft <= 0) { clearInterval(confettiInterval); confettiInterval = null; return }
    const particleCount = 50 * (timeLeft / duration)
    confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } })
    confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } })
  }, 250)
}

function handleProcess() {
  if (!canProcess.value) {
    if (!(parsedAmount.value > 0)) toast.error('Please enter a valid amount')
    else if (customerMode.value === 'guest' && !guestEmail.value.trim()) toast.error('Please enter a guest email')
    else if (customerMode.value === 'existing' && !props.selectedCustomer) toast.error('Please select a customer')
    return
  }

  isSuccess.value = true
  try { toast.success('Payment processed successfully!') } catch {}
  startConfetti()

  const details = {
    amount: parsedAmount.value,
    customer: customerMode.value === 'existing'
      ? props.selectedCustomer
      : { name: 'Guest', email: guestEmail.value.trim() },
    paymentMethod: paymentMethod.value,
    pdq: pdq.value,
    receiptOptions: { print: receiptOptions.print, email: receiptOptions.email },
  }

  successTimer = setTimeout(() => {
    emit('process', details)
  }, 3000)
}

function onKey(e: KeyboardEvent) {
  if (isSuccess.value) {
    if (e.key === 'Escape') { e.preventDefault() }
    return
  }
  const target = e.target as HTMLElement | null
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement

  if (e.key === 'Escape') {
    e.preventDefault()
    if (typing) (target as HTMLElement).blur()
    else onBack()
    return
  }
  if (typing) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  const k = e.key.toLowerCase()
  if (k === 's') { e.preventDefault(); emit('activate-customer-search') }
  else if (k === 'u') { e.preventDefault(); emit('new-customer') }
  else if (k === 'p') { e.preventDefault(); receiptOptions.print = !receiptOptions.print }
  else if (k === 'e') { e.preventDefault(); receiptOptions.email = !receiptOptions.email }
  else if (e.key === 'Enter' && canProcess.value) { e.preventDefault(); handleProcess() }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  nextTick(() => amountInput.value?.focus())
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (successTimer) clearTimeout(successTimer)
  if (confettiInterval) clearInterval(confettiInterval)
})
</script>
