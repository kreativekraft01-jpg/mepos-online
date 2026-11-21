<template>
  <div class="flex h-screen bg-background text-foreground overflow-hidden font-sans">
    <PosSidebar
      :is-open="isSidebarOpen"
      :current-float="currentFloat"
      :theme="theme"
      @close="isSidebarOpen = false"
      @close-banking="handleCloseBankingSidebar"
      @toggle-theme="toggleTheme"
    />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <TopNavigation
        :current-float="currentFloat"
        :customers="customerResults"
        :boxes="boxResults"
        :orders="orderResults"
        :is-cart-page="currentPage === 'cart'"
        :is-customer-search-active="isCustomerSearchActive"
        @open-sidebar="isSidebarOpen = true"
        @add-customer="showNewCustomerModal = true"
        @recent-transactions="showHistory = true"
        @cart="openCart()"
        @change-float="handleCloseBankingSidebar"
        @new-transaction="handleNewTransaction"
        @logo-click="currentPage = 'home'"
        @deactivate-customer-search="isCustomerSearchActive = false"
        @add-to-current-transaction="handleAddToCurrentTransaction"
        @add-to-new-transaction="handleAddToNewTransaction"
        @attach-customer="handleAttachCustomer"
        @view-customer="handleViewCustomer"
        @view-all-customers="handleViewAllCustomers"
      />

      <main class="flex-1 overflow-hidden relative flex flex-col">
        <HomePage
          v-if="currentPage === 'home'"
          :branch-name="currentFloat?.name || 'MEPOS'"
          :currency="store.settings.currency"
          :todays-figures="todaysFigures"
          @new-customer="showNewCustomerModal = true"
          @current-transaction="openCart()"
          @new-transaction="handleNewTransaction"
          @test-orders="toast.info('Test orders')"
          @refund="handleRefundInitiate"
          @relabel="toast.info('Relabel')"
          @reprint-receipt="toast.info('Reprint receipt')"
          @gift-voucher="currentPage = 'gift-voucher'"
          @price-request="toast.info('Price request')"
          @gift-receipt="toast.info('Gift receipt')"
          @donate="toast.info('Donate')"
        />

        <CartPage
          v-else-if="currentPage === 'cart'"
          :key="`cart-${cartInstance}-${restoredCartTs}`"
          :initial-items="cartItems"
          :pending-cart-item="pendingCartItem"
          :selected-customer="selectedCustomer"
          @back="currentPage = 'home'"
          @activate-customer-search="isCustomerSearchActive = true"
          @update:pending-cart-item="(v:any) => pendingCartItem = v"
          @attach-customer="handleAttachCustomer"
          @transaction-complete="handleTransactionComplete"
          @save-transaction="handleSaveCart"
          @items-change="(v:any) => cartItems = v"
        />

        <CustomerListing
          v-else-if="currentPage === 'customer-listing'"
          @back="currentPage = 'home'"
          @customer-click="handleCustomerClick"
          @attach-to-transaction="handleAttachCustomer"
          @test-order="handleListingTestOrder"
          @refund="handleListingRefund"
          @gift-voucher="handleListingGiftVoucher"
        />

        <CustomerProfile
          v-else-if="currentPage === 'customer-profile'"
          :customer="profileCustomer"
          @back="currentPage = profileReturnTo === 'customer-listing' ? 'customer-listing' : 'home'"
          @attach-to-transaction="handleAttachCustomer"
        />

        <RefundOrder
          v-else-if="currentPage === 'refund-order'"
          :order-id="selectedOrderId || ''"
          @back="currentPage = 'home'"
          @proceed="handleRefundProceed"
        />

        <RefundCheckout
          v-else-if="currentPage === 'refund-checkout'"
          :refund-details="refundDetails!"
          @back="currentPage = 'refund-order'"
          @process="handleRefundProcess"
        />

        <GiftVoucherPage
          v-else-if="currentPage === 'gift-voucher'"
          :selected-customer="selectedCustomer"
          @back="currentPage = 'home'"
          @activate-customer-search="isCustomerSearchActive = true"
          @new-customer="showNewCustomerModal = true"
          @process="handleGiftVoucherProcess"
        />
      </main>

      <!-- Order History (modal overlay) -->
      <OrderHistory
        v-if="showHistory"
        :orders="transactionHistory"
        :unprocessed="unprocessedTransactions"
        @close="showHistory = false"
        @restore-transaction="handleRestoreTransaction"
      />
    </div>

    <OpenBanking
      v-if="showOpenBanking"
      :tills="store.tills"
      :sales="store.sales"
      :currency="store.settings.currency"
      @complete="handleFloatSelected"
      @close="showOpenBanking = false"
    />

    <CloseBanking
      v-if="showCloseBanking"
      :till="activeTill"
      :sales="store.sales"
      :currency="store.settings.currency"
      @close="showCloseBanking = false"
      @complete="handleCloseBankingComplete"
    />

    <NewCustomerModal
      :is-open="showNewCustomerModal"
      @close="showNewCustomerModal = false"
      @signup="handleCustomerSignup"
    />

    <ScreenSaver
      v-if="showScreenSaver && !showOpenBanking"
      :branch-name="currentFloat?.name || 'MEPOS'"
      @navigate="handleScreenSaverNavigate"
    />

    <!-- Refund manager auth -->
    <div v-if="showAuthModal" class="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="showAuthModal = false"></div>
      <div class="relative bg-card border-2 border-border w-full max-w-md shadow-2xl">
        <div class="bg-muted px-6 py-4 flex items-center justify-between border-b border-border">
          <div class="flex items-center gap-2 font-bold text-lg"><Lock class="w-5 h-5 text-primary" /> Manager Approval</div>
          <button class="p-1 hover:bg-background" @click="showAuthModal = false"><X class="w-5 h-5" /></button>
        </div>
        <form class="p-6 space-y-4" @submit.prevent="handleAuthSubmit">
          <p class="text-sm text-muted-foreground">Enter a manager tag to authorize this refund.</p>
          <input v-model="managerTag" class="w-full px-4 py-3 bg-background border-2 border-border focus:border-primary outline-none" placeholder="Manager tag / ID" autofocus />
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 px-4 py-3 border-2 border-border font-bold uppercase tracking-wider hover:bg-muted" @click="showAuthModal = false">Cancel</button>
            <button type="submit" class="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-2"><Check class="w-4 h-4" /> Authorize</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toaster is mounted once at root App.vue -->
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Lock, X, Check } from 'lucide-vue-next'
import confetti from 'canvas-confetti'

import TopNavigation from './components/TopNavigation.vue'
import PosSidebar from './components/Sidebar.vue'
import HomePage from './components/HomePage.vue'
import CartPage from './components/CartPage.vue'
import OrderHistory from './components/OrderHistory.vue'
import OpenBanking from './components/OpenBanking.vue'
import ScreenSaver from './components/ScreenSaver.vue'
import NewCustomerModal from './components/NewCustomerModal.vue'
import CustomerListing from './components/CustomerListing.vue'
import CustomerProfile from './components/CustomerProfile.vue'
import RefundOrder from './components/RefundOrder.vue'
import RefundCheckout from './components/RefundCheckout.vue'
import GiftVoucherPage from './components/GiftVoucherPage.vue'
import CloseBanking from './components/CloseBanking.vue'

import { useStore, selectTodaysFigures } from '@/store/useStore'
import { toCustomerResult, transactionItemToCartItem, saleToOrderResult, productToBox, saleToTransaction, cartToTransaction } from './data/bridge'
import type { CartItem, SavedCart, Sale, PaymentSplit } from '@/types'
import type { TransactionItem, Transaction } from './types'
import type { CustomerResult } from './components/SearchResultsTypes'

type Page = 'home' | 'cart' | 'customer-profile' | 'customer-listing' | 'refund-order' | 'refund-checkout' | 'gift-voucher'

const store = useStore()

const currentPage = ref<Page>('home')
const isSidebarOpen = ref(false)
const showOpenBanking = ref(false)
const showCloseBanking = ref(false)
const showHistory = ref(false)
const isCustomerSearchActive = ref(false)
const selectedCustomer = ref<CustomerResult | null>(null)
const profileCustomer = ref<CustomerResult | null>(null)
const profileReturnTo = ref<'home' | 'customer-listing' | 'cart' | 'gift-voucher'>('home')
const showNewCustomerModal = ref(false)
const showScreenSaver = ref(false)

const currentFloat = ref<{ amount: number; name: string } | null>(null)
const cartItems = ref<TransactionItem[]>([])
const cartInstance = ref(0)
const restoredCartTs = ref(0)
const pendingCartItem = ref<TransactionItem | null>(null)

const showAuthModal = ref(false)
const managerTag = ref('')
const selectedOrderId = ref<string | null>(null)
const refundDetails = ref<{ amount: number; method: string; reason: string; receiptOptions: { print: boolean; email: boolean }; orderId: string; items?: any[] } | null>(null)

const theme = ref<'dark' | 'light'>('dark')
function applyTheme(next: 'dark' | 'light') {
  theme.value = next
  document.documentElement.classList.toggle('dark', next === 'dark')
  document.documentElement.classList.toggle('light', next === 'light')
}
function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}
onMounted(() => { applyTheme(theme.value) })

const activeTill = computed(() => store.tills.find((t) => t.id === store.activeTillId) || store.tills.find((t) => t.status === 'open'))

const todaysFigures = computed(() => selectTodaysFigures(store.sales))
const customerResults = computed(() => store.customers.map(toCustomerResult))
const boxResults = computed(() => store.products.map((p) => productToBox(p, store.categories)))
const orderResults = computed(() => store.sales.filter((s) => s.kind !== 'refund' && !s.refundedAt).map((s) => saleToOrderResult(s, store.customers)))

const transactionHistory = computed<Transaction[]>(() => {
  const custName = (s: Sale) => store.customers.find((c) => c.id === s.customerId)?.name ?? 'Walk-in Customer'
  const tillOf = (s: Sale) => store.tills.find((t) => t.id === s.tillId)
  return [...store.sales]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => saleToTransaction(s, custName(s), tillOf(s)))
})

const unprocessedTransactions = computed<Transaction[]>(() => {
  const active = activeTill.value
  return (store.savedCarts || []).map((sc: SavedCart) => {
    const customerName = store.customers.find((c) => c.id === sc.customerId)?.name ?? 'Walk-in Customer'
    return cartToTransaction(sc.items as any, { customerName, till: active, orderNumber: sc.id, createdAt: sc.createdAt })
  })
})

// auto open banking when none open
watch([() => store.ready, () => store.tills], () => {
  if (!store.ready) return
  const open = store.tills.find((t) => t.status === 'open')
  if (!open) {
    showOpenBanking.value = true
    currentFloat.value = null
  } else {
    currentFloat.value = { amount: open.openingFloat, name: open.name }
    if (!store.activeTillId) store.setActiveTill(open.id)
  }
}, { immediate: true, deep: true })

function openCart() {
  const empty = !cartItems.value.length
  if (empty && store.cart.length > 0) {
    // keep existing in-memory items, but if none map store cart? prefer in-memory flow
  }
  currentPage.value = 'cart'
}

function handleAddToCurrentTransaction(item: TransactionItem) {
  pendingCartItem.value = item
  currentPage.value = 'cart'
}

function handleNewTransaction() {
  if (cartItems.value.length > 0) {
    handleSaveCart(cartItems.value)
  }
  cartItems.value = []
  selectedCustomer.value = null
  store.setCustomerId(undefined)
  cartInstance.value++
  currentPage.value = 'cart'
  toast.info('New transaction started')
}

function handleAddToNewTransaction(item: TransactionItem) {
  handleNewTransaction()
  pendingCartItem.value = item
}

function handleAttachCustomer(customer: CustomerResult) {
  selectedCustomer.value = customer
  store.setCustomerId(customer.id)
  isCustomerSearchActive.value = false
  if (currentPage.value === 'customer-profile') {
    currentPage.value = profileReturnTo.value === 'gift-voucher' ? 'gift-voucher' : 'home'
    profileCustomer.value = null
  } else if (currentPage.value !== 'cart' && currentPage.value !== 'gift-voucher') {
    currentPage.value = 'cart'
  }
  toast.success(`Customer attached: ${customer.name}`)
}

function handleViewCustomer(customer: CustomerResult) {
  profileCustomer.value = customer
  profileReturnTo.value = (currentPage.value === 'customer-listing' ? 'customer-listing' : 'home')
  isCustomerSearchActive.value = false
  currentPage.value = 'customer-profile'
}

function handleCustomerClick(customer: any) {
  profileCustomer.value = customer as CustomerResult
  profileReturnTo.value = 'customer-listing'
  currentPage.value = 'customer-profile'
}
function handleViewAllCustomers() { currentPage.value = 'customer-listing' }
function handleListingTestOrder(customer: CustomerResult) { toast.info(`Creating test order for ${customer.name}`) }
function handleListingRefund(customer: CustomerResult) { toast.info(`Starting refund for ${customer.name}`) }
function handleListingGiftVoucher(customer: CustomerResult) { toast.info(`Issuing gift voucher for ${customer.name}`) }

function handleCustomerSignup(customer: any) {
  const name = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer'
  const contact = customer.contactInfo || ''
  const isEmail = contact.includes('@')
  const created = store.addCustomer({ name, email: isEmail ? contact : '', phone: isEmail ? '' : contact, balance: 0, notes: '' })
  showNewCustomerModal.value = false
  const result = toCustomerResult(created)
  selectedCustomer.value = result
  store.setCustomerId(created.id)
  toast.success(`Customer ${name} added`)
}

function handleSaveCart(items: TransactionItem[]) {
  if (!items.length) return
  cartItems.value = items
  store.setState({ cart: items.map(transactionItemToCartItem) as any, customerId: selectedCustomer.value?.id, discount: 0 })
  const saved = store.saveCart(store.cart as any)
  if (saved) {
    cartItems.value = []
    selectedCustomer.value = null
    store.setCustomerId(undefined)
    toast.success('Transaction saved')
  }
}

function handleRestoreTransaction(orderNumber: string) {
  const ok = store.restoreSavedCart(orderNumber)
  if (ok) {
    const st = store.getState()
    cartItems.value = (st.cart as any[]).map((c: any) => ({
      id: c.id, boxName: c.name, stockLevel: c.stockLevel, category: c.category, boxId: c.boxId, type: c.type, price: c.price, qty: c.qty, requiresSerial: c.requiresSerial, serialNumber: c.serialNumber
    }))
    const cust = st.customerId ? store.customers.find((c) => c.id === st.customerId) : null
    selectedCustomer.value = cust ? toCustomerResult(cust) : null
    restoredCartTs.value = Date.now()
    showHistory.value = false
    currentPage.value = 'cart'
    toast.success('Transaction restored')
  } else {
    toast.error('Could not restore transaction')
  }
}

const REFUND_METHODS: Record<string, string> = { cash: 'cash', card: 'card', voucher: 'voucher', bank: 'bank_transfer', cheque: 'cheque', paypal: 'upi', bitcoin: 'upi', datacash: 'card', justeat: 'card' }

function handleRefundInitiate(orderId: string) {
  selectedOrderId.value = orderId
  currentPage.value = 'refund-order'
}
function handleRefundProceed(details: any) {
  const items = Array.isArray(details?.items) ? details.items : []
  const reasons = [...new Set(items.map((i: any) => i?.reasonLabel).filter(Boolean))]
  const reasonText = reasons.length === 1 ? reasons[0] : (reasons.length > 1 ? 'Multiple reasons' : 'Refund')
  refundDetails.value = {
    amount: Number(details?.amount || 0),
    method: 'cash',
    reason: reasonText,
    receiptOptions: { print: true, email: false },
    orderId: details?.orderId || selectedOrderId.value || '',
    items,
  }
  currentPage.value = 'refund-checkout'
}
function handleRefundProcess(method: string, receiptOptions: { print: boolean; email: boolean }) {
  if (refundDetails.value) refundDetails.value = { ...refundDetails.value, method, receiptOptions }
  showAuthModal.value = true
}
function handleAuthSubmit() {
  if (!managerTag.value.trim() || !refundDetails.value) return
  const original = store.sales.find((s) => s.id === refundDetails.value!.orderId || s.receiptNo === refundDetails.value!.orderId)
  const fallback = store.sales.filter((s) => s.kind !== 'refund' && !s.refundedAt).slice(-1)[0]
  const sale = original ?? fallback
  if (!sale) {
    toast.error('No order found to refund')
    showAuthModal.value = false
    managerTag.value = ''
    return
  }
  const detailItems = Array.isArray((refundDetails.value as any).items) ? (refundDetails.value as any).items : []
  let items: CartItem[] = detailItems.map((it: any, i: number) => {
    const orig = typeof it.index === 'number' ? sale.items[it.index] : null
    const qty = Math.max(1, Number(it.qty || orig?.qty || 1))
    const amount = Number(it.amount ?? 0)
    const perUnit = Math.round((amount / qty) * 100) / 100
    const itemType: any = sale.kind === 'buy' ? 'buy' : 'sell'
    return {
      id: `refund-${Date.now()}-${i}`,
      productId: it.productId || orig?.productId || '',
      name: it.name || orig?.name || 'Refund item',
      boxId: '',
      category: '',
      stockLevel: 0,
      type: itemType,
      price: perUnit,
      qty,
      requiresSerial: false,
    } as CartItem
  })

  if (items.length === 0) {
    items = [{
      id: `refund-${Date.now()}`,
      productId: sale.id,
      name: 'Refund',
      boxId: '',
      category: '',
      stockLevel: 1,
      type: sale.kind === 'buy' ? 'buy' : 'sell',
      price: refundDetails.value.amount,
      qty: 1,
      requiresSerial: false
    }]
  }

  const payMethod = REFUND_METHODS[refundDetails.value.method] ?? 'cash'
  const res = store.refundSale(sale.id, items, [{ method: payMethod as any, amount: refundDetails.value.amount }], managerTag.value.trim())
  showAuthModal.value = false
  managerTag.value = ''
  if (res.ok) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    toast.success(`Refund processed: ${store.settings.currency}${refundDetails.value.amount.toFixed(2)}`)
    refundDetails.value = null
    selectedOrderId.value = null
    currentPage.value = 'home'
  } else {
    toast.error(res.error || 'Refund failed')
  }
}

function handleGiftVoucherProcess(details: any) {
  const amount = Number(details?.amount || 0)
  if (!(amount > 0)) { toast.error('Enter a valid amount'); return }
  const customerId = selectedCustomer.value?.id
  const v = store.issueGiftVoucher(amount, customerId)
  if (v) {
    toast.success(`Gift voucher ${v.code} issued · ${store.settings.currency}${amount.toFixed(2)}`)
    currentPage.value = 'home'
  } else {
    toast.error('Could not issue gift voucher')
  }
}

function handleTransactionComplete(payments: PaymentSplit[], items?: TransactionItem[]) {
  const source = (items && items.length ? items : cartItems.value)
  if (!source.length) return
  cartItems.value = source
  store.setState({ cart: source.map(transactionItemToCartItem) as any, customerId: selectedCustomer.value?.id, discount: 0 })
  const res = store.checkout(payments)
  if (res.ok) {
    toast.success(`Sale complete${res.receiptNo ? ` · #${res.receiptNo}` : ''}`)
    cartItems.value = []
    selectedCustomer.value = null
    store.setCustomerId(undefined)
  } else {
    toast.error(res.error || 'Checkout failed')
  }
}

function handleFloatSelected(data: { amount: number; name: string }) {
  currentFloat.value = { amount: data.amount, name: data.name }
  showOpenBanking.value = false
}

function handleCloseBankingSidebar() {
  isSidebarOpen.value = false
  if (activeTill.value) {
    showCloseBanking.value = true
  } else {
    showOpenBanking.value = true
  }
}
function handleCloseBankingComplete() {
  showCloseBanking.value = false
  currentFloat.value = null
  // till is now closed; let store/watchers drive open-banking prompt if needed
  showOpenBanking.value = true
  toast.success('Banking closed')
}

// screensaver after inactivity
let idleTimer: any = null
function resetIdle() {
  if (showScreenSaver.value) return
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => { if (!showOpenBanking.value) showScreenSaver.value = true }, 5 * 60 * 1000)
}
function handleScreenSaverNavigate(target: 'home' | 'cart') {
  showScreenSaver.value = false
  currentPage.value = target === 'cart' ? 'cart' : 'home'
  resetIdle()
}
onMounted(() => {
  const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
  events.forEach((e) => window.addEventListener(e, resetIdle))
  resetIdle()
  onBeforeUnmount(() => {
    clearTimeout(idleTimer)
    events.forEach((e) => window.removeEventListener(e, resetIdle))
  })
})

// keyboard shortcuts
function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const inInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  if (inInput) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'Escape') {
    if (isSidebarOpen.value) isSidebarOpen.value = false
    else if (showHistory.value) showHistory.value = false
    else if (showScreenSaver.value) { /* keep until user navigates */ }
    return
  }
  if (e.key === 'F1') { e.preventDefault(); currentPage.value = 'home' }
  else if (e.key === 'F2') { e.preventDefault(); openCart() }
  else if (e.key === 'F3') { e.preventDefault(); isCustomerSearchActive.value = true }
  else if (e.key === 'F4') { e.preventDefault(); showHistory.value = true }
  else if (e.key === 'F8') { e.preventDefault(); showNewCustomerModal.value = true }
}
function handleAssistantAddToCart(e: Event) {
  const item = (e as CustomEvent).detail as TransactionItem | undefined
  if (!item) return
  handleAddToCurrentTransaction(item)
  toast.success(`Added ${item.boxName} to cart`)
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('mepos:assistant-add-to-cart', handleAssistantAddToCart as EventListener)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('mepos:assistant-add-to-cart', handleAssistantAddToCart as EventListener)
})
</script>
