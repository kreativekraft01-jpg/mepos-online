<template>
  <div class="flex flex-col h-full bg-background overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 relative">
    <!-- Header -->
    <div class="flex items-center gap-4 p-4 border-b border-border bg-card shrink-0">
      <button @click="$emit('back')" class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors" title="Back (Esc)">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <div class="flex items-center gap-6 min-w-0">
        <h1 class="text-xl font-black text-foreground uppercase tracking-wider flex items-center gap-3">Process Refund</h1>
        <div class="h-5 w-px bg-border hidden sm:block" />
        <div class="flex items-center gap-4 text-sm text-muted-foreground font-mono min-w-0">
          <span class="truncate">Order #{{ displayOrderId }}</span>
          <span class="w-1 h-1 bg-neutral-600 rounded-full hidden sm:block" />
          <span>{{ orderItems.length }} Items Available</span>
        </div>
      </div>
    </div>

    <div v-if="!sale" class="flex-1 flex items-center justify-center p-8 text-muted-foreground">
      No refundable order found for this id.
    </div>

    <div v-else class="flex-1 grid grid-cols-12 h-full min-h-0">
      <!-- Left: Item List -->
      <div class="col-span-12 lg:col-span-5 border-r border-border flex flex-col bg-card min-h-0">
        <div class="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Items to Refund</h3>
          <button class="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline" @click="toggleSelectAll">
            {{ allSelected ? 'Clear all' : 'Select all' }}
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <div
            v-for="item in orderItems"
            :key="item.key"
            @click="toggleItem(item.key)"
            :class="['relative p-3 border rounded-lg cursor-pointer transition-all group', isSelected(item.key) ? 'bg-secondary border-primary ring-1 ring-primary/20' : 'bg-card border-border hover:border-primary/50']"
          >
            <div class="flex gap-3">
              <div :class="['w-5 h-5 mt-1 border rounded flex items-center justify-center transition-colors shrink-0', isSelected(item.key) ? 'bg-primary border-primary text-primary-foreground' : 'bg-input border-border group-hover:border-primary']">
                <Check v-if="isSelected(item.key)" class="w-3.5 h-3.5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <span :class="['text-sm font-medium truncate', isSelected(item.key) ? 'text-foreground' : 'text-muted-foreground']">{{ item.name }}</span>
                  <span class="text-xs font-mono font-bold text-foreground shrink-0">{{ currency }}{{ item.originalTotal.toFixed(2) }}</span>
                </div>
                <div class="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide flex items-center gap-2">
                  <span v-if="item.qty > 1">Qty {{ item.qty }}</span>
                  <span v-else>Item</span>
                </div>
                <div v-if="isSelected(item.key)" class="mt-2 flex items-center gap-2">
                  <span class="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                    REFUNDING: {{ currency }}{{ itemAmount(item.key).toFixed(2) }}
                  </span>
                  <CheckCircle v-if="isItemComplete(item.key)" class="w-3 h-3 text-emerald-500" />
                  <AlertCircle v-else class="w-3 h-3 text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Details -->
      <div class="col-span-12 lg:col-span-7 bg-background flex flex-col min-h-0 overflow-y-auto">
        <template v-if="!activeKey">
          <div class="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
            Select an item from the list to configure refund details.
          </div>
        </template>
        <template v-else>
          <div class="p-6 border-b border-border flex items-center gap-4 bg-card shrink-0 sticky top-0 z-20">
            <div class="min-w-0">
              <h2 class="text-lg font-bold text-foreground truncate">{{ activeItem?.name }}</h2>
              <div class="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span class="bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold">Qty {{ activeItem?.qty || 1 }}</span>
                <span>Original: <span class="text-foreground font-mono">{{ currency }}{{ (activeItem?.originalTotal || 0).toFixed(2) }}</span></span>
              </div>
            </div>
          </div>

          <div class="p-6 flex-1 space-y-8 pb-32">
            <!-- Amount -->
            <div>
              <h3 class="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign class="w-4 h-4 text-primary" /> Refund Amount
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label :class="['flex flex-col justify-between p-4 border cursor-pointer transition-all rounded-sm', activeState.method === 'original' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50']">
                  <div class="flex items-center gap-3 mb-2">
                    <input type="radio" class="accent-primary w-4 h-4" :checked="activeState.method === 'original'" @change="setMethod('original')" />
                    <span class="font-bold text-foreground text-sm">Full Refund</span>
                  </div>
                  <div class="text-lg font-bold text-primary font-mono pl-7">{{ currency }}{{ (activeItem?.originalTotal || 0).toFixed(2) }}</div>
                </label>

                <label :class="['flex flex-col justify-between p-4 border cursor-pointer transition-all rounded-sm', activeState.method === 'current' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50']">
                  <div class="flex items-center gap-3 mb-2">
                    <input type="radio" class="accent-primary w-4 h-4" :checked="activeState.method === 'current'" @change="setMethod('current')" />
                    <span class="font-bold text-foreground text-sm">Market Value</span>
                  </div>
                  <div class="text-lg font-bold text-primary font-mono pl-7">{{ currency }}{{ (activeItem?.currentTotal || 0).toFixed(2) }}</div>
                </label>

                <label :class="['flex flex-col justify-between p-4 border cursor-pointer transition-all rounded-sm', activeState.method === 'custom' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50']">
                  <div class="flex items-center gap-3 mb-2">
                    <input type="radio" class="accent-primary w-4 h-4" :checked="activeState.method === 'custom'" @change="setMethod('custom')" />
                    <span class="font-bold text-foreground text-sm">Custom</span>
                  </div>
                  <div class="pl-7">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">{{ currency }}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        :disabled="activeState.method !== 'custom'"
                        v-model="activeState.customAmount"
                        @focus="setMethod('custom')"
                        placeholder="0.00"
                        class="w-full bg-input border border-border h-9 pl-6 pr-2 text-foreground font-mono text-sm focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                </label>
              </div>
              <p v-if="activeState.method === 'custom' && customAmountError(activeKey)" class="text-xs text-destructive mt-2">{{ customAmountError(activeKey) }}</p>
            </div>

            <!-- Reasons -->
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Refund Reason <span class="text-primary">*</span></label>
                  <div class="relative">
                    <select v-model="activeState.reasonId" @change="activeState.subReason = ''" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer">
                      <option value="" disabled>Select a reason</option>
                      <option v-for="r in REASONS" :key="r.id" :value="r.id">{{ r.label }}</option>
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none w-4 h-4" />
                  </div>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Sub-Reason <span class="text-primary">*</span></label>
                  <div class="relative">
                    <select v-model="activeState.subReason" :disabled="!activeState.reasonId" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50">
                      <option value="" disabled>Select details</option>
                      <option v-for="sub in subReasonsFor(activeState.reasonId)" :key="sub" :value="sub">{{ sub }}</option>
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none w-4 h-4" />
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <h3 class="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText class="w-4 h-4 text-primary" /> Notes
                </h3>
                <textarea v-model="activeState.notes" placeholder="Additional comments about item condition..." class="w-full h-24 p-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none transition-colors resize-none placeholder:text-muted-foreground"></textarea>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="p-4 bg-card border-t border-border z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.25)] shrink-0">
      <div class="flex items-center justify-between gap-6 max-w-[1920px] mx-auto">
        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected Items</div>
            <div class="text-sm font-medium text-foreground">{{ selectedKeys.length }} items ready</div>
          </div>
        </div>
        <button
          @click="handleProceed"
          :disabled="!isValid"
          class="flex-1 max-w-full md:max-w-md lg:max-w-lg h-14 bg-primary hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground font-bold uppercase tracking-wider text-base transition-all shadow-lg disabled:shadow-none flex items-center justify-between px-6 rounded-sm hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>Proceed to Refund</span>
          <span class="font-mono text-xl bg-black/10 px-4 py-1 rounded">{{ currency }}{{ totalRefundAmount.toFixed(2) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ArrowLeft, AlertCircle, Check, DollarSign, FileText, ChevronDown, CheckCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useStore } from '@/store/useStore'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ back: []; proceed: [details: any] }>()

const store = useStore()
const currency = computed(() => store.settings.currency || '£')

const REASONS = [
  { id: '48hr', label: '48 Hour Return', subReasons: ['Changed my mind', 'Unwanted Gift', 'Found Cheaper'] },
  { id: 'faulty', label: 'Faulty / Defective', subReasons: ['Does not power on', 'Disk drive failure', 'Overheating', 'Controller drift'] },
  { id: 'error', label: 'Staff Error', subReasons: ['Wrong item sold', 'Incorrect grade', 'Pricing error'] },
] as const

interface ItemState {
  selected: boolean
  method: 'original' | 'current' | 'custom'
  customAmount: string
  reasonId: string
  subReason: string
  notes: string
}

const sale = computed(() => {
  if (props.orderId) {
    return store.sales.find(s => (s.id === props.orderId || s.receiptNo === props.orderId) && s.kind !== 'refund' && !s.refundedAt) || null
  }
  return store.sales.filter(s => s.kind !== 'refund' && !s.refundedAt).slice(-1)[0] || null
})

const displayOrderId = computed(() => sale.value?.receiptNo || sale.value?.id || props.orderId || '(latest)')

const orderItems = computed(() => {
  const s = sale.value
  if (!s) return [] as { key: string; name: string; qty: number; originalTotal: number; currentTotal: number }[]
  return s.items.map((it, idx) => {
    const originalTotal = Math.round(Math.abs(it.price) * (it.qty || 1) * 100) / 100
    return {
      key: `${s.id}-${idx}`,
      name: it.name || 'Item',
      qty: it.qty || 1,
      originalTotal,
      currentTotal: originalTotal,
    }
  })
})

const states = reactive<Record<string, ItemState>>({})

function ensureState(key: string) {
  if (!states[key]) {
    states[key] = { selected: false, method: 'original', customAmount: '', reasonId: '', subReason: '', notes: '' }
  }
  return states[key]
}

watch(orderItems, (items) => {
  for (const it of items) ensureState(it.key)
}, { immediate: true })

const selectedKeys = computed(() => orderItems.value.map(i => i.key).filter(k => states[k]?.selected))
const allSelected = computed(() => orderItems.value.length > 0 && selectedKeys.value.length === orderItems.value.length)

const activeKey = ref<string | null>(null)
watch(selectedKeys, (keys) => {
  if (keys.length === 0) { activeKey.value = null; return }
  if (!activeKey.value || !keys.includes(activeKey.value)) activeKey.value = keys[keys.length - 1]
}, { immediate: true })

const activeItem = computed(() => orderItems.value.find(i => i.key === activeKey.value) || null)
const activeState = computed(() => activeKey.value ? ensureState(activeKey.value) : ensureState('__none__'))

function isSelected(key: string) { return !!states[key]?.selected }

function toggleItem(key: string) {
  const st = ensureState(key)
  st.selected = !st.selected
  if (st.selected) activeKey.value = key
}

function toggleSelectAll() {
  if (allSelected.value) {
    for (const it of orderItems.value) ensureState(it.key).selected = false
    activeKey.value = null
  } else {
    for (const it of orderItems.value) ensureState(it.key).selected = true
    if (orderItems.value.length) activeKey.value = orderItems.value[orderItems.value.length - 1].key
  }
}

function subReasonsFor(reasonId: string) {
  return REASONS.find(r => r.id === reasonId)?.subReasons || []
}

function setMethod(method: 'original' | 'current' | 'custom') {
  if (!activeKey.value) return
  const st = ensureState(activeKey.value)
  st.method = method
  if (method === 'custom' && !st.customAmount) {
    const item = activeItem.value
    if (item) st.customAmount = item.originalTotal.toFixed(2)
  }
}

function itemAmount(key: string) {
  const st = states[key]
  const item = orderItems.value.find(i => i.key === key)
  if (!st || !item) return 0
  if (st.method === 'original') return item.originalTotal
  if (st.method === 'current') return item.currentTotal
  const n = parseFloat(st.customAmount)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0
}

function customAmountError(key: string) {
  const st = states[key]
  const item = orderItems.value.find(i => i.key === key)
  if (!st || !item || st.method !== 'custom') return ''
  const n = parseFloat(st.customAmount)
  if (!Number.isFinite(n) || n <= 0) return 'Enter a valid custom amount'
  if (n - 0.001 > item.originalTotal) return 'Amount cannot exceed original price'
  return ''
}

function isItemComplete(key: string) {
  const st = states[key]
  if (!st || !st.selected) return false
  if (!st.reasonId || !st.subReason) return false
  if (st.method === 'custom') {
    if (customAmountError(key)) return false
  } else {
    if (!(itemAmount(key) > 0)) return false
  }
  return true
}

const totalRefundAmount = computed(() => {
  return Math.round(selectedKeys.value.reduce((sum, k) => sum + itemAmount(k), 0) * 100) / 100
})

const isValid = computed(() => {
  if (selectedKeys.value.length === 0) return false
  if (!(totalRefundAmount.value > 0)) return false
  return selectedKeys.value.every(k => isItemComplete(k))
})

function handleProceed() {
  if (!isValid.value) { toast.error('Please complete details for all selected items'); return }
  const s = sale.value
  const details = {
    orderId: s?.id || props.orderId,
    amount: totalRefundAmount.value,
    items: selectedKeys.value.map(k => {
      const st = states[k]
      const item = orderItems.value.find(i => i.key === k)!
      const reason = REASONS.find(r => r.id === st.reasonId)
      const idx = orderItems.value.findIndex(i => i.key === k)
      const original = s?.items[idx]
      return {
        key: k,
        index: idx,
        productId: original?.productId || '',
        name: item.name,
        qty: item.qty,
        amount: itemAmount(k),
        originalTotal: item.originalTotal,
        method: st.method,
        reasonId: st.reasonId,
        reasonLabel: reason?.label || '',
        subReason: st.subReason,
        notes: st.notes,
      }
    }),
  }
  emit('proceed', details)
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
    if (e.key === 'Escape') (e.target as HTMLElement).blur()
    return
  }
  if (e.key === 'Escape') { e.preventDefault(); emit('back') }
  else if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); toggleSelectAll() }
  else if (e.key === 'Enter' && isValid.value) { e.preventDefault(); handleProceed() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
