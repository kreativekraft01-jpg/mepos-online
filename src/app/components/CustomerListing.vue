<template>
  <div class="flex flex-col h-full bg-background animate-in fade-in slide-in-from-right-4 duration-300">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-border bg-card shrink-0 px-6 py-3.5">
      <div class="flex items-center gap-4">
        <button @click="$emit('back')" class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors" title="Back (Esc)">
          <ArrowLeft class="w-6 h-6" />
        </button>
        <div class="flex items-baseline items-center gap-4">
          <h1 class="text-xl font-black text-foreground uppercase tracking-wider">Customer Search</h1>
          <div class="h-5 w-px bg-border" />
          <div class="text-sm text-muted-foreground font-mono">{{ filteredCustomers.length }} Customers Found</div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="search"
            placeholder="Search name, email, mobile..."
            class="w-72 max-w-[40vw] pl-9 pr-3 py-2 bg-background border border-border text-sm focus:border-primary outline-none"
          />
        </div>
        <div class="flex items-center bg-muted border border-border p-1 rounded-sm">
          <button
            v-for="type in (['All','Unified','Legacy'] as const)"
            :key="type"
            @click="filterType = type"
            :class="['px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors', filterType === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']"
          >
            {{ type }}
          </button>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div class="flex-1 overflow-auto bg-background p-6">
      <div class="w-full text-left border border-border">
        <!-- Table Header -->
        <div class="grid grid-cols-12 bg-muted border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-widest sticky top-0 z-10">
          <div class="col-span-1 px-4 py-2">Type</div>
          <div class="col-span-2 px-4 py-2">First Name</div>
          <div class="col-span-2 px-4 py-2">Last Name</div>
          <div class="col-span-3 px-4 py-2">Address</div>
          <div class="col-span-2 px-4 py-2">Email</div>
          <div class="col-span-1 px-4 py-2">Mobile</div>
          <div class="col-span-1 px-4 py-2 text-center">Action</div>
        </div>

        <!-- Body -->
        <div class="bg-card">
          <div v-if="filteredCustomers.length === 0" class="p-10 text-center text-muted-foreground text-sm">No customers found.</div>
          <div
            v-for="customer in filteredCustomers"
            :key="customer.id"
            @click="emit('customer-click', customer)"
            class="grid grid-cols-12 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group items-center text-sm text-foreground"
          >
            <div class="col-span-1 px-4 py-2">
              <span :class="['px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border', customer.type === 'Unified' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-amber-500/30 text-amber-500 bg-amber-500/10']">
                {{ customer.type }}
              </span>
            </div>
            <div class="col-span-2 px-4 py-2 font-medium truncate">{{ customer.firstName }}</div>
            <div class="col-span-2 px-4 py-2 font-medium truncate">{{ customer.lastName }}</div>
            <div class="col-span-3 px-4 py-2 text-muted-foreground truncate" :title="customer.address">{{ customer.address || '—' }}</div>
            <div class="col-span-2 px-4 py-2 text-muted-foreground truncate" :title="customer.email">{{ customer.email || '—' }}</div>
            <div class="col-span-1 px-4 py-2 text-muted-foreground font-mono truncate">{{ customer.phone || '—' }}</div>

            <div class="col-span-1 px-4 py-2 flex justify-center" @click.stop>
              <div class="relative">
                <button
                  @click="toggleMenu(customer.id)"
                  class="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  :aria-expanded="openMenuId === customer.id"
                >
                  <MoreHorizontal class="w-4 h-4" />
                </button>
                <div v-if="openMenuId === customer.id" class="absolute right-0 mt-1 w-48 bg-card border border-border shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5 mb-1 border-b border-border">Attach To</div>
                  <button @click="actionAndClose(() => emit('attach-to-transaction', customer))" class="w-full flex items-center gap-2 px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left">
                    <ShoppingCart class="w-4 h-4" /> Transaction
                  </button>
                  <button @click="actionAndClose(() => emit('test-order', customer))" class="w-full flex items-center gap-2 px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left">
                    <TestTube2 class="w-4 h-4" /> Test Order
                  </button>
                  <button @click="actionAndClose(() => emit('refund', customer))" class="w-full flex items-center gap-2 px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left">
                    <RotateCcw class="w-4 h-4" /> Refund
                  </button>
                  <button @click="actionAndClose(() => emit('gift-voucher', customer))" class="w-full flex items-center gap-2 px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left">
                    <Gift class="w-4 h-4" /> Gift Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, Search, MoreHorizontal, ShoppingCart, TestTube2, RotateCcw, Gift } from 'lucide-vue-next'
import { useStore } from '@/store/useStore'
import { toCustomerResult } from '../data/bridge'
import type { CustomerResult } from './SearchResultsTypes'

interface ListingCustomer extends CustomerResult {
  type: 'Unified' | 'Legacy'
  firstName: string
  lastName: string
  address: string
}

const emit = defineEmits<{
  back: []
  'customer-click': [customer: CustomerResult]
  'attach-to-transaction': [customer: CustomerResult]
  'test-order': [customer: CustomerResult]
  refund: [customer: CustomerResult]
  'gift-voucher': [customer: CustomerResult]
}>()

const store = useStore()
const searchQuery = ref('')
const filterType = ref<'All' | 'Unified' | 'Legacy'>('All')
const searchInput = ref<HTMLInputElement | null>(null)
const openMenuId = ref<string | null>(null)

function splitName(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const customers = computed<ListingCustomer[]>(() =>
  store.customers.map(c => {
    const base = toCustomerResult(c)
    const { firstName, lastName } = splitName(base.name)
    return {
      ...base,
      type: 'Unified',
      firstName,
      lastName,
      address: (c as any).address || '', // not in schema; shown if present
    }
  })
)

const filteredCustomers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return customers.value.filter(c => {
    if (filterType.value !== 'All' && c.type !== filterType.value) return false
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    )
  })
})

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}
function actionAndClose(fn: () => void) {
  openMenuId.value = null
  fn()
}
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest) return
  // close when clicking outside any menu trigger/content in this component
  if (!target.closest('.relative')) openMenuId.value = null
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  if (typing) {
    if (e.key === 'Escape') {
      e.preventDefault()
      ;(target as HTMLElement).blur()
    }
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    if (openMenuId.value) openMenuId.value = null
    else emit('back')
    return
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const k = e.key.toLowerCase()
  if (k === 'f') {
    e.preventDefault()
    filterType.value = filterType.value === 'All' ? 'Unified' : filterType.value === 'Unified' ? 'Legacy' : 'All'
  } else if (e.key === '/' || k === 's') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('click', onDocClick)
})
</script>
