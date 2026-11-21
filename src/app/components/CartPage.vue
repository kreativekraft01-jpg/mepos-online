<template>
  <div class="flex-1 bg-background flex flex-col overflow-hidden transition-all duration-300 relative">
    <div :class="['flex-1 flex flex-col overflow-hidden transition-all duration-300', showPaymentDue ? 'mr-[36rem]' : '']">
      <!-- Top controls -->
      <div class="bg-background px-6 py-4 border-b border-border/10">
        <div class="flex items-center justify-between gap-6">
          <div class="flex items-center gap-4 flex-wrap">
            <TransactionModeSelector :selected-mode="transactionMode" :is-read-only="showPaymentDue" @select-mode="handleTransactionModeChange" />

            <template v-if="!showPaymentDue && items.length > 0">
              <div class="h-8 w-px bg-border"></div>
              <div class="flex items-center gap-2">
                <button @click="onSave" class="p-3 bg-card hover:bg-muted border border-border rounded-none transition-colors text-muted-foreground hover:text-foreground" title="Save transaction">
                  <Save class="w-5 h-5" />
                </button>
                <button @click="handleTidyToggle" :aria-pressed="groupedView" :class="['p-3 border rounded-none transition-colors', groupedView ? 'bg-primary/10 border-primary text-primary' : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground']" :title="groupedView ? 'Tidy Row (grouped)' : 'Show individual rows'">
                  <Layers class="w-5 h-5" />
                </button>
                <button class="p-3 bg-card hover:bg-muted border border-border rounded-none transition-colors text-muted-foreground hover:text-foreground" title="Test Order" @click="toast.info('Test Order')">
                  <TestTube2 class="w-5 h-5" />
                </button>

                <button v-if="selectedItems.length > 0" @click="deleteDialog = 'selected'" class="px-4 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none flex items-center gap-2 text-sm transition-colors shadow-lg">
                  <Trash2 class="w-4 h-4" /> Delete {{ selectedItems.length }}
                </button>
                <button v-else @click="deleteDialog = 'all'" class="p-3 bg-card hover:bg-muted border border-border rounded-none transition-colors text-muted-foreground hover:text-foreground" title="Delete All">
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </template>
          </div>

          <div>
            <div v-if="selectedCustomer">
              <div v-if="showPaymentDue" class="px-4 py-2 bg-primary/10 border border-primary/50 rounded-none flex items-center gap-2.5">
                <div class="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-none"><span class="text-sm font-bold">{{ selectedCustomer.name.charAt(0) }}</span></div>
                <div class="font-semibold text-sm text-foreground">{{ selectedCustomer.name }}</div>
              </div>
              <div v-else class="px-4 py-2 bg-card border border-primary/30 rounded-[4px] flex items-center gap-2.5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <div class="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-none"><span class="text-sm font-bold">{{ selectedCustomer.name.charAt(0) }}</span></div>
                <div class="flex-1">
                  <div class="font-semibold text-sm text-foreground">{{ selectedCustomer.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ selectedCustomer.email }} • {{ selectedCustomer.phone }}</div>
                </div>
                <button @click="$emit('activate-customer-search')" class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-none text-sm text-foreground transition-colors">Change</button>
              </div>
            </div>
            <button v-else-if="!showPaymentDue" @click="$emit('activate-customer-search')" class="px-6 py-3 bg-white/5 border border-white/10 text-primary rounded-none text-[12px] font-semibold uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3 group">
              <UserPlus class="w-5 h-5" /> Add Customer
            </button>
          </div>
        </div>
      </div>

      <!-- Product Table -->
      <div class="flex-1 overflow-y-auto p-6 pb-32">
        <ProductTable
          :items="items"
          :selected-items="selectedItems"
          :is-payment-mode="showPaymentDue"
          @toggle-item="handleToggleItem"
          @toggle-all="handleToggleAll"
          @change-type="handleChangeType"
          @change-price="handleChangePrice"
          @change-qty="handleChangeQty"
          @remove-item="handleRemoveItem"
          @add-serial-number="handleAddSerialNumber"
        />
      </div>

      <!-- Footer -->
      <div class="fixed bottom-0 left-0 bg-card border-t border-border px-6 py-2 z-30 w-full transition-all duration-300">
        <div class="flex items-center justify-between max-w-full mx-auto gap-8">
          <div v-if="items.length > 0" class="flex gap-8">
            <div>
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sell</div>
              <div class="text-lg font-bold text-[#10B981] font-normal">£{{ sellTotal.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Buy</div>
              <div class="text-lg font-bold text-[#8B5CF6] font-normal">£{{ buyTotal.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exchange</div>
              <div class="text-lg font-bold text-[#3B82F6] font-normal">£{{ exchangeTotal.toFixed(2) }}</div>
            </div>
            <div class="h-8 w-px bg-border self-center"></div>
            <div>
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">IN</div>
              <div class="text-lg font-bold text-foreground font-normal">{{ inCount }} items</div>
            </div>
            <div>
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OUT</div>
              <div class="text-lg font-bold text-foreground font-normal">{{ outCount }} items</div>
            </div>
          </div>
          <div v-else></div>

          <button v-if="!showPaymentDue" :disabled="ctaState.disabled" @click="showPaymentDue = true" class="ml-auto px-8 py-2 bg-primary hover:brightness-110 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-none text-lg font-semibold transition-colors whitespace-nowrap hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3">
            {{ ctaState.text }}
            <kbd v-if="!ctaState.disabled" class="px-2 py-1 bg-black/20 border border-primary-foreground/20 text-xs font-mono text-primary-foreground font-semibold shadow-sm">Enter</kbd>
          </button>
        </div>
      </div>
    </div>

    <SerialNumberModal v-if="serialModalItem" :box-name="serialModalItem.boxName" @save="handleSaveSerialNumber" @cancel="serialModalItem = null" />

    <PaymentDue
      :is-open="showPaymentDue"
      :total="total"
      :sell-total="sellTotal"
      :buy-total="buyTotal"
      :exchange-total="exchangeTotal"
      @close="showPaymentDue = false"
      @complete="handleComplete"
    />

    <ConfirmDialog
      :is-open="deleteDialog !== null"
      :title="deleteDialog === 'all' ? 'Delete All Items' : 'Delete Selected Items'"
      :message="deleteDialog === 'all' ? 'Are you sure you want to delete all items? This will remove every item from your transaction.' : `Are you sure you want to delete ${selectedItems.length} selected item(s)? This will remove them from your transaction.`"
      confirm-label="Delete"
      danger
      @cancel="deleteDialog = null"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Save, Layers, TestTube2, Trash2, UserPlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import TransactionModeSelector from './TransactionModeSelector.vue'
import ProductTable from './ProductTable.vue'
import SerialNumberModal from './SerialNumberModal.vue'
import PaymentDue from './PaymentDue.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useSound } from '../hooks/useSound'
import type { TransactionItem } from '../types'
import type { PaymentSplit } from '../../types'
import type { CustomerResult } from './SearchResultsTypes'

const props = defineProps<{
  initialItems?: TransactionItem[]
  pendingCartItem?: TransactionItem | null
  selectedCustomer?: CustomerResult | null
}>()

const emit = defineEmits<{
  back: []
  'activate-customer-search': []
  'update:pending-cart-item': [item: TransactionItem | null]
  'attach-customer': [c: CustomerResult]
  'transaction-complete': [payments: PaymentSplit[], items: TransactionItem[]]
  'save-transaction': [items: TransactionItem[]]
  'items-change': [items: TransactionItem[]]
}>()

const { playBeep } = useSound()

const transactionMode = ref<'sell' | 'buy' | 'exchange'>('sell')
const items = ref<TransactionItem[]>([...(props.initialItems || [])])
const groupedView = ref(true)
const selectedItems = ref<string[]>([])
const serialModalItem = ref<TransactionItem | null>(null)
const showPaymentDue = ref(false)
const deleteDialog = ref<'all' | 'selected' | null>(null)
const prevCustomerRef = ref<CustomerResult | null | undefined>(props.selectedCustomer)

const round2 = (n: number) => Math.round(n * 100) / 100

const mergeKey = (item: TransactionItem) => `${item.boxId || item.boxName}|${item.type}|${item.price}`
function mergeItems(list: TransactionItem[]): TransactionItem[] {
  const out: TransactionItem[] = []
  const indexByKey = new Map<string, number>()
  for (const item of list) {
    if (item.requiresSerial) { out.push(item); continue }
    const key = mergeKey(item)
    const idx = indexByKey.get(key)
    if (idx !== undefined) out[idx] = { ...out[idx], qty: out[idx].qty + item.qty }
    else { indexByKey.set(key, out.length); out.push({ ...item }) }
  }
  return out
}
function expandItems(list: TransactionItem[]): TransactionItem[] {
  const out: TransactionItem[] = []
  for (const item of list) {
    if (item.requiresSerial || item.qty <= 1) { out.push(item); continue }
    for (let i = 0; i < item.qty; i++) {
      out.push({ ...item, id: `${item.id}-row-${i}-${Math.random().toString(36).slice(2, 7)}`, qty: 1 })
    }
  }
  return out
}

watch(items, (v) => emit('items-change', v), { deep: true })

// pending item from search
watch(() => props.pendingCartItem, (p) => {
  if (!p) return
  playBeep()
  const unique = { ...p, id: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }
  if (groupedView.value && !unique.requiresSerial) {
    const key = mergeKey(unique)
    const existing = items.value.find(e => mergeKey(e) === key)
    if (existing) items.value = items.value.map(e => e.id === existing.id ? { ...e, qty: e.qty + 1 } : e)
    else items.value = [...items.value, unique]
  } else {
    items.value = [...items.value, unique]
  }
  emit('update:pending-cart-item', null)
})

// customer attach sound parity
watch(() => props.selectedCustomer, (c) => {
  if (c && c !== prevCustomerRef.value) playBeep()
  prevCustomerRef.value = c
})

function handleTidyToggle() {
  const newItems = groupedView.value ? expandItems(items.value) : mergeItems(items.value)
  const validIds = new Set(newItems.map(i => i.id))
  items.value = newItems
  selectedItems.value = selectedItems.value.filter(id => validIds.has(id))
  groupedView.value = !groupedView.value
}

function handleTransactionModeChange(mode: 'sell' | 'buy' | 'exchange') {
  transactionMode.value = mode
  items.value = items.value.map(i => ({ ...i, type: mode }))
}

const sellTotal = computed(() => items.value.filter(i => i.type === 'sell').reduce((s, i) => s + i.price * i.qty, 0))
const buyTotal = computed(() => items.value.filter(i => i.type === 'buy').reduce((s, i) => s + i.price * i.qty, 0))
const exchangeTotal = computed(() => items.value.filter(i => i.type === 'exchange').reduce((s, i) => s + i.price * i.qty, 0))
const inCount = computed(() => items.value.filter(i => i.type === 'buy' || i.type === 'exchange').reduce((s, i) => s + i.qty, 0))
const outCount = computed(() => items.value.filter(i => i.type === 'sell' || i.type === 'exchange').reduce((s, i) => s + i.qty, 0))
const subtotal = computed(() => sellTotal.value - buyTotal.value)
const total = computed(() => round2(subtotal.value))

const hasPendingSerialNumbers = computed(() => items.value.some(i => i.requiresSerial && !i.serialNumber))
const customerAdded = computed(() => !!props.selectedCustomer)

const ctaState = computed(() => {
  if (items.value.length === 0) return { disabled: true, text: 'No Items' }
  if (hasPendingSerialNumbers.value) return { disabled: true, text: 'Serial Number Pending' }
  if (!customerAdded.value) return { disabled: true, text: 'Customer Not Selected' }
  if (total.value > 0.005) return { disabled: false, text: `PAY: £${total.value.toFixed(2)}` }
  if (total.value < -0.005) return { disabled: false, text: `PAYOUT: £${Math.abs(total.value).toFixed(2)}` }
  return { disabled: false, text: 'BALANCED — £0.00' }
})

function handleToggleItem(id: string) { selectedItems.value = selectedItems.value.includes(id) ? selectedItems.value.filter(i => i !== id) : [...selectedItems.value, id] }
function handleToggleAll() { selectedItems.value = selectedItems.value.length === items.value.length ? [] : items.value.map(i => i.id) }
function handleChangeType(id: string, type: 'sell' | 'buy' | 'exchange') { items.value = items.value.map(i => i.id === id ? { ...i, type } : i) }
function handleChangePrice(id: string, price: number) { items.value = items.value.map(i => i.id === id ? { ...i, price } : i) }
function handleChangeQty(id: string, qty: number) { items.value = items.value.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i) }
function handleRemoveItem(id: string) { items.value = items.value.filter(i => i.id !== id); selectedItems.value = selectedItems.value.filter(i => i !== id) }
function handleAddSerialNumber(id: string) { serialModalItem.value = items.value.find(i => i.id === id) || null }
function handleSaveSerialNumber(serialNumber: string) {
  if (!serialModalItem.value) return
  items.value = items.value.map(i => i.id === serialModalItem.value!.id ? { ...i, serialNumber } : i)
  serialModalItem.value = null
}
function handleConfirmDelete() {
  if (deleteDialog.value === 'all') { items.value = []; selectedItems.value = [] }
  else if (deleteDialog.value === 'selected') { items.value = items.value.filter(i => !selectedItems.value.includes(i.id)); selectedItems.value = [] }
  deleteDialog.value = null
}
function onSave() { emit('save-transaction', [...items.value]) }

function handleComplete(payments: PaymentSplit[]) {
  const snapshot = [...items.value]
  emit('transaction-complete', payments, snapshot)
  // fallback reset
  items.value = []
  selectedItems.value = []
  showPaymentDue.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
    if (e.key === 'Escape' && showPaymentDue.value) showPaymentDue.value = false
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    if (showPaymentDue.value) showPaymentDue.value = false
    else emit('back')
  } else if (e.key.toLowerCase() === 's') {
    e.preventDefault()
    emit('activate-customer-search')
  } else if (e.key === 'Enter' && !ctaState.value.disabled && !showPaymentDue.value) {
    e.preventDefault()
    showPaymentDue.value = true
  } else if (e.key === 'Delete' && selectedItems.value.length > 0 && !showPaymentDue.value) {
    e.preventDefault()
    deleteDialog.value = 'selected'
  } else if (e.key.toLowerCase() === 'a' && e.ctrlKey) {
    e.preventDefault()
    handleToggleAll()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
