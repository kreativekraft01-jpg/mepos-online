<template>
  <div class="flex-1 bg-background p-4 lg:p-6 overflow-hidden flex flex-col h-full relative">
    <!-- Refund Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showRefundModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="closeRefund"></div>
          <div class="relative bg-card w-full max-w-md border border-border shadow-2xl overflow-hidden">
            <div class="bg-muted/40 px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 class="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <RotateCcw class="w-4 h-4 text-destructive" />
                Find Order for Refund
              </h3>
              <button @click="closeRefund" class="text-muted-foreground hover:text-foreground transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>
            <form @submit.prevent="handleRefundSubmit" class="p-6">
              <div class="space-y-4">
                <div>
                  <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Order Number</label>
                  <input
                    ref="refundInputRef"
                    v-model="refundOrderId"
                    type="text"
                    class="w-full h-12 px-4 bg-background border border-border text-foreground text-lg font-mono focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground"
                    placeholder="e.g. ORD-2024-8821"
                  />
                </div>
              </div>
              <div class="mt-6 flex justify-end gap-3">
                <button type="button" @click="closeRefund" class="px-4 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-bold uppercase tracking-wider text-xs transition-colors">
                  Cancel
                </button>
                <button type="submit" :disabled="!refundOrderId.trim()" class="px-6 py-2 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold uppercase tracking-wider text-xs transition-all">
                  Find Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="flex-1 grid grid-cols-12 gap-6 min-h-0">
      <!-- Left Column -->
      <div class="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
        <!-- Header -->
        <div class="flex justify-between items-end border-b border-border pb-4 shrink-0">
          <div>
            <h1 class="text-3xl font-light tracking-tight text-foreground uppercase">{{ branchName }}</h1>
            <div class="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{{ todayLabel }}</div>
          </div>
        </div>

        <!-- Primary Actions -->
        <div class="grid grid-cols-2 auto-rows-fr gap-4 flex-1 min-h-0">
          <button
            @click="$emit('new-transaction')"
            class="col-span-2 lg:col-span-1 lg:row-span-2 group relative bg-primary text-primary-foreground p-6 lg:p-8 flex flex-col items-start justify-between hover:brightness-110 transition-all rounded-[4px] overflow-hidden min-h-0 border border-transparent hover:border-primary-foreground/10"
          >
            <div class="absolute -right-12 -top-12 w-64 h-64 bg-black/5 rounded-full blur-3xl group-hover:bg-black/10 transition-colors duration-500"></div>
            <div class="absolute top-4 right-4 z-10">
              <kbd class="px-2 py-1 bg-black/20 border border-primary-foreground/20 text-xs font-mono text-primary-foreground font-semibold shadow-sm">N</kbd>
            </div>
            <div class="p-2 lg:p-4 rounded-none mb-4 lg:mb-6 relative z-10">
              <FileText class="w-8 h-8 lg:w-10 lg:h-10" :stroke-width="1" />
            </div>
            <div class="relative z-10 w-full text-left">
              <span class="text-3xl lg:text-4xl font-light block mb-2 tracking-tight leading-tight">New<br />Transaction</span>
              <div class="h-px w-12 bg-primary-foreground/50 mb-3 lg:mb-4 group-hover:w-24 transition-all duration-500"></div>
              <span class="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                Start Sale <ArrowRight class="w-4 h-4" />
              </span>
            </div>
          </button>

          <button
            @click="$emit('new-customer')"
            class="group relative bg-card border border-border p-5 lg:p-6 flex flex-col items-start justify-between transition-all rounded-[4px] overflow-hidden min-h-0 hover:bg-muted hover:border-primary/50 hover:shadow-lg"
          >
            <div class="absolute top-4 right-4">
              <kbd class="px-2 py-1 bg-muted border border-border text-xs font-mono text-muted-foreground font-semibold shadow-sm">U</kbd>
            </div>
            <div class="p-2 rounded-none mb-2 group-hover:text-primary transition-colors">
              <UserPlus class="w-6 h-6" :stroke-width="1.5" />
            </div>
            <div class="text-left">
              <span class="text-lg font-medium block">New Customer</span>
              <span class="text-xs text-muted-foreground uppercase tracking-wider">Register &amp; Details</span>
            </div>
          </button>

          <button
            @click="$emit('current-transaction')"
            class="group relative bg-card border border-border p-5 lg:p-6 flex flex-col items-start justify-between transition-all rounded-[4px] overflow-hidden min-h-0 hover:bg-muted hover:border-primary/50 hover:shadow-lg"
          >
            <div class="absolute top-4 right-4">
              <kbd class="px-2 py-1 bg-muted border border-border text-xs font-mono text-muted-foreground font-semibold shadow-sm">C</kbd>
            </div>
            <div class="p-2 rounded-none mb-2 group-hover:text-primary transition-colors">
              <ShoppingBag class="w-6 h-6" :stroke-width="1.5" />
            </div>
            <div class="text-left">
              <span class="text-lg font-medium block">Current Transaction</span>
              <span class="text-xs text-muted-foreground uppercase tracking-wider">View &amp; Edit Cart</span>
            </div>
          </button>
        </div>

        <!-- Today's Figures -->
        <div class="bg-card border border-border p-6 shrink-0 rounded-[4px] hover:border-border/80 transition-colors">
          <h2 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Today's Figures</h2>
          <div class="grid grid-cols-4 gap-8">
            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sales</div>
              <div class="text-2xl font-light tracking-tight text-[#10B981]">{{ currency }}{{ todaysFigures.sales.toFixed(2) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Buys</div>
              <div class="text-2xl font-light tracking-tight text-[#8B5CF6]">{{ currency }}{{ todaysFigures.buys.toFixed(2) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Exchange</div>
              <div class="text-2xl font-light tracking-tight text-[#3B82F6]">{{ currency }}{{ todaysFigures.exchange.toFixed(2) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Refunds</div>
              <div class="text-2xl font-light tracking-tight text-[#EF4444]">{{ currency }}{{ (-todaysFigures.refunds).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Quick Actions -->
      <div class="col-span-12 lg:col-span-4 flex flex-col h-full bg-card border border-border rounded-[4px] overflow-hidden">
        <div class="p-6 border-b border-border shrink-0 bg-muted/20">
          <h2 class="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-primary rounded-none animate-pulse"></div>
            Quick Actions
          </h2>
        </div>
        <div class="grid grid-cols-2 auto-rows-fr gap-px bg-border flex-1 overflow-y-auto">
          <button
            v-for="(btn, idx) in quickActions"
            :key="idx"
            @click="btn.action()"
            class="bg-card group flex flex-col items-center justify-center gap-3 p-4 transition-all hover:bg-muted hover:z-10 relative overflow-hidden"
          >
            <component :is="btn.icon" class="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" :stroke-width="1.5" />
            <span class="text-[14px] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">{{ btn.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { UserPlus, ShoppingBag, FileText, TestTube2, RotateCcw, Tag, Printer, Gift, DollarSign, Receipt, Heart, ArrowRight, X } from 'lucide-vue-next'

const props = defineProps<{
  branchName: string
  currency: string
  todaysFigures: { sales: number; buys: number; exchange: number; refunds: number }
}>()

const emit = defineEmits<{
  'new-customer': []
  'current-transaction': []
  'new-transaction': []
  'test-orders': []
  'refund': [orderId: string]
  'relabel': []
  'reprint-receipt': []
  'gift-voucher': []
  'price-request': []
  'gift-receipt': []
  'donate': []
}>()

const showRefundModal = ref(false)
const refundOrderId = ref('')
const refundInputRef = ref<HTMLInputElement | null>(null)

const todayLabel = computed(() => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

const quickActions = [
  { label: 'Test Orders', icon: TestTube2, action: () => emit('test-orders') },
  { label: 'Refund', icon: RotateCcw, action: () => openRefund() },
  { label: 'Relabel', icon: Tag, action: () => emit('relabel') },
  { label: 'Reprint Receipt', icon: Printer, action: () => emit('reprint-receipt') },
  { label: 'Gift Voucher', icon: Gift, action: () => emit('gift-voucher') },
  { label: 'Price Request', icon: DollarSign, action: () => emit('price-request') },
  { label: 'Gift Receipt', icon: Receipt, action: () => emit('gift-receipt') },
  { label: 'Donate', icon: Heart, action: () => emit('donate') },
]

function openRefund() {
  showRefundModal.value = true
  refundOrderId.value = ''
  nextTick(() => refundInputRef.value?.focus())
}
function closeRefund() { showRefundModal.value = false; refundOrderId.value = '' }
function handleRefundSubmit() {
  if (!refundOrderId.value.trim()) return
  emit('refund', refundOrderId.value.trim())
  closeRefund()
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const inInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  if (inInput) {
    if (e.key === 'Escape') {
      if (showRefundModal.value) closeRefund()
      else (target as HTMLElement).blur()
    }
    return
  }
  if (showRefundModal.value) {
    if (e.key === 'Escape') { e.preventDefault(); closeRefund() }
    return
  }
  const k = e.key.toLowerCase()
  if (k === 'n') { e.preventDefault(); emit('new-transaction') }
  else if (k === 'u') { e.preventDefault(); emit('new-customer') }
  else if (k === 'c') { e.preventDefault(); emit('current-transaction') }
  else if (k === 'r') { e.preventDefault(); openRefund() }
  else if (k === 't') { e.preventDefault(); emit('test-orders') }
  else if (k === 'g') { e.preventDefault(); emit('gift-voucher') }
  else if (k === 'p') { e.preventDefault(); emit('price-request') }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
