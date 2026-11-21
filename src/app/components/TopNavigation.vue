<template>
  <nav class="bg-card text-foreground border-b border-border relative z-50">
    <div class="flex items-center gap-4 px-4 py-3 relative">
      <!-- Sidebar Menu Icon -->
      <button
        @click="$emit('open-sidebar')"
        class="p-3 hover:bg-muted rounded-none transition-colors border border-transparent hover:border-border text-muted-foreground"
        title="Open menu"
      >
        <Menu class="w-6 h-6" />
      </button>

      <!-- MEPoS Logo -->
      <button
        @click="$emit('logo-click')"
        class="flex items-center hover:bg-muted rounded-none transition-colors px-4 py-2 border border-transparent hover:border-border group"
        title="Go to Home"
      >
        <div class="text-2xl font-black italic tracking-tighter text-foreground transition-all duration-300 group-hover:tracking-normal relative">
          ME<span class="text-primary drop-shadow-[0_0_10px_rgba(219,115,55,0.5)]">PoS</span>
          <div class="absolute -bottom-1 right-0 w-8 h-0.5 bg-primary/50 group-hover:w-full transition-all duration-500 ease-out"></div>
        </div>
      </button>

      <!-- Search Bar -->
      <div class="flex-[2] min-w-0" ref="searchContainerRef">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none z-10" />
          <input
            ref="searchInputRef"
            type="text"
            :value="searchQuery"
            @input="handleSearchChange"
            @focus="handleSearchFocus"
            :placeholder="isCustomerSearchActive ? 'Search customers...' : 'Search box, customer or order'"
            class="w-full pl-12 pr-12 py-3 bg-muted border border-border rounded-[4px] text-base focus:outline-none focus:border-primary placeholder:text-neutral-500 transition-colors text-foreground"
          />
          <button
            v-if="searchQuery"
            @click="handleCloseSearch"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-border rounded-none transition-colors"
            title="Clear search"
          >
            <X class="w-5 h-5 text-neutral-400 hover:text-foreground" />
          </button>
        </div>

        <SearchResults
          v-if="showSearchResults && searchQuery.trim().length > 0"
          :query="searchQuery"
          :customers="customers"
          :boxes="boxes"
          :orders="orders"
          :customers-only="isCustomerSearchActive"
          @close="handleCloseSearch"
          @add-to-current-transaction="(i:any) => { $emit('add-to-current-transaction', i); handleCloseSearch() }"
          @add-to-new-transaction="(i:any) => { $emit('add-to-new-transaction', i); handleCloseSearch() }"
          @attach-customer="(c:any) => { $emit('attach-customer', c); handleCloseSearch() }"
          @view-customer="(c:any) => { $emit('view-customer', c); handleCloseSearch() }"
          @view-all-customers="() => { $emit('view-all-customers'); handleCloseSearch() }"
        />
      </div>

      <!-- Action Icons -->
      <div class="flex-1 flex items-center justify-between gap-2 ml-4">
        <button
          @click="$emit('add-customer')"
          class="p-3 hover:bg-muted rounded-none transition-colors group relative border border-transparent hover:border-border text-muted-foreground"
          title="Add Customer"
        >
          <UserPlus class="w-6 h-6 group-hover:text-primary transition-colors" />
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-card border border-border text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Add Customer</span>
        </button>

        <button
          @click="$emit('recent-transactions')"
          class="p-3 hover:bg-muted rounded-none transition-colors group relative border border-transparent hover:border-border text-muted-foreground"
          title="Recent Transactions"
        >
          <History class="w-6 h-6 group-hover:text-primary transition-colors" />
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-card border border-border text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Recent Transactions</span>
        </button>

        <button
          v-if="isCartPage"
          @click="$emit('new-transaction')"
          class="p-3 hover:bg-muted rounded-none transition-colors group relative border border-transparent hover:border-border"
          title="New Transaction"
        >
          <PlusCircle class="w-6 h-6 text-primary" />
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-card border border-border text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">New Transaction</span>
        </button>
        <button
          v-else
          @click="$emit('cart')"
          class="p-3 hover:bg-muted rounded-none transition-colors group relative border border-transparent hover:border-border"
          title="Cart"
        >
          <ShoppingCart class="w-6 h-6 group-hover:text-primary transition-colors" />
          <span class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-card border border-border text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Cart</span>
        </button>

        <button
          @click="$emit('change-float')"
          class="ml-2 px-4 py-3 bg-muted hover:bg-secondary rounded-[4px] transition-colors flex items-center gap-2 text-base border border-border group"
          title="Change float"
        >
          <span class="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{{ currentFloat?.name || 'No Float' }}</span>
          <ChevronDown class="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Menu, Search, UserPlus, History, ShoppingCart, PlusCircle, X, ChevronDown } from 'lucide-vue-next'
import SearchResults from './SearchResults.vue'
import type { CustomerResult, BoxResult, OrderResult } from './SearchResultsTypes'

const props = withDefaults(defineProps<{
  currentFloat: { amount: number; name: string } | null
  customers?: CustomerResult[]
  boxes?: BoxResult[]
  orders?: OrderResult[]
  isCartPage?: boolean
  isCustomerSearchActive?: boolean
}>(), { customers: () => [], boxes: () => [], orders: () => [], isCartPage: false, isCustomerSearchActive: false })

const emit = defineEmits<{
  'open-sidebar': []
  'add-customer': []
  'recent-transactions': []
  'cart': []
  'change-float': []
  'new-transaction': []
  'logo-click': []
  'deactivate-customer-search': []
  'add-to-current-transaction': [item: any]
  'add-to-new-transaction': [item: any]
  'attach-customer': [c: any]
  'view-customer': [c: any]
  'view-all-customers': []
}>()

const searchQuery = ref('')
const showSearchResults = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchContainerRef = ref<HTMLElement | null>(null)

watch(() => props.isCustomerSearchActive, (v) => {
  if (v) {
    searchInputRef.value?.focus()
    showSearchResults.value = true
  }
})

function handleSearchChange(e: Event) {
  const value = (e.target as HTMLInputElement).value
  searchQuery.value = value
  showSearchResults.value = value.trim().length > 0
}

function handleCloseSearch() {
  showSearchResults.value = false
  searchQuery.value = ''
  searchInputRef.value?.blur()
  if (props.isCustomerSearchActive) emit('deactivate-customer-search')
}

function handleSearchFocus() {
  if (searchQuery.value.trim().length > 0) showSearchResults.value = true
}

function onDocMouseDown(event: MouseEvent) {
  const el = searchContainerRef.value
  if (el && !el.contains(event.target as Node)) {
    showSearchResults.value = false
    if (props.isCustomerSearchActive) emit('deactivate-customer-search')
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showSearchResults.value) {
    handleCloseSearch()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown)
  document.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
  document.removeEventListener('keydown', onKeyDown)
})
</script>
