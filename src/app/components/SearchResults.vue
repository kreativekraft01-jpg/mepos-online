<template>
  <div class="fixed top-[70px] left-6 right-6 mt-[8px] bg-card rounded-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-4 border-border z-[100] text-foreground">
    <!-- Results -->
    <div class="max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div v-if="!hasQuery" class="p-8 text-center text-muted-foreground">
        <p class="text-base">{{ customersOnly ? 'Start typing to search for customers...' : 'Start typing to search for boxes, customers, or orders...' }}</p>
      </div>
      <div v-else-if="!hasResults" class="p-8 text-center text-muted-foreground">
        <p class="text-base">No results found for "{{ query }}"</p>
      </div>
      <div v-else>
        <!-- Box Results -->
        <div v-if="!customersOnly && filteredBoxes.length > 0" class="border-b-2 border-border">
          <div class="sticky top-0 bg-muted px-4 py-3 flex items-center justify-between gap-4 border-b border-border z-10">
            <div class="flex items-center gap-2">
              <Package class="w-5 h-5 text-muted-foreground" />
              <h4 class="text-sm font-bold text-foreground">Boxes ({{ filteredBoxes.length }})</h4>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              <div class="relative">
                <select
                  v-model="category"
                  class="px-4 py-2 pr-10 border-2 border-border rounded-none text-sm bg-card text-foreground cursor-pointer hover:border-primary focus:outline-none focus:border-primary min-w-[140px] appearance-none"
                  @mousedown.stop
                >
                  <option value="">All Categories</option>
                  <option v-for="cat in filterCategories" :key="cat" :value="cat.toLowerCase()">{{ cat }}</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown class="w-4 h-4" />
                </div>
              </div>

              <div class="relative">
                <select
                  v-model="status"
                  class="px-4 py-2 pr-10 border-2 border-border rounded-none text-sm bg-card text-foreground cursor-pointer hover:border-primary focus:outline-none focus:border-primary min-w-[120px] appearance-none"
                  @mousedown.stop
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="deleted">Deleted</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown class="w-4 h-4" />
                </div>
              </div>

              <div class="relative">
                <select
                  v-model="availability"
                  class="px-4 py-2 pr-10 border-2 border-border rounded-none text-sm bg-card text-foreground cursor-pointer hover:border-primary focus:outline-none focus:border-primary min-w-[140px] appearance-none"
                  @mousedown.stop
                >
                  <option value="">All Availability</option>
                  <option value="instock">In Stock</option>
                  <option value="lowstock">Low Stock</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown class="w-4 h-4" />
                </div>
              </div>

              <!-- Status Checkboxes -->
              <div class="flex items-center gap-4 pl-2 border-l border-border h-8">
                <label class="flex items-center gap-2 cursor-pointer group select-none">
                  <div :class="['w-4 h-4 border border-muted-foreground transition-colors flex items-center justify-center', showDiscontinued ? 'bg-primary border-primary' : 'bg-transparent group-hover:border-primary']">
                    <Check v-if="showDiscontinued" class="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span class="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">Discontinued</span>
                  <input type="checkbox" class="hidden" v-model="showDiscontinued" />
                </label>

                <label class="flex items-center gap-2 cursor-pointer group select-none">
                  <div :class="['w-4 h-4 border border-muted-foreground transition-colors flex items-center justify-center', showDeleted ? 'bg-primary border-primary' : 'bg-transparent group-hover:border-primary']">
                    <Check v-if="showDeleted" class="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span class="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">Deleted</span>
                  <input type="checkbox" class="hidden" v-model="showDeleted" />
                </label>
              </div>
            </div>
          </div>
          <div class="p-2">
            <div v-for="box in filteredBoxes" :key="box.id" class="mb-1">
              <button
                @click="expandedBoxId = expandedBoxId === box.id ? null : box.id"
                :class="['w-full p-3 rounded-none transition-colors text-left border-2', expandedBoxId === box.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:border-primary/50 hover:bg-muted']"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-base truncate text-foreground">{{ box.name }}</span>
                      <span class="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-none flex-shrink-0">Stock: {{ box.stockLevel }}</span>
                      <span v-if="box.status === 'discontinued'" class="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-none flex-shrink-0">Discontinued</span>
                      <span v-else-if="box.status === 'deleted'" class="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-none flex-shrink-0">Deleted</span>
                    </div>
                    <div class="text-xs text-muted-foreground">{{ box.category }} • ID: {{ box.boxId }}</div>
                  </div>
                  <div class="flex gap-4 flex-shrink-0">
                    <div>
                      <div class="text-xs text-muted-foreground mb-0.5 text-[13px]">Sell</div>
                      <div class="text-sm font-bold text-[#34D399] font-normal">£{{ box.sellPrice.toFixed(2) }}</div>
                    </div>
                    <div>
                      <div class="text-xs text-muted-foreground mb-0.5 text-[13px]">Buy</div>
                      <div class="text-sm font-bold text-[#A78BFA] font-normal">£{{ box.buyPrice.toFixed(2) }}</div>
                    </div>
                    <div>
                      <div class="text-xs text-muted-foreground mb-0.5 text-[13px]">Exch</div>
                      <div class="text-sm font-bold text-[#60A5FA] font-normal">£{{ box.exchangePrice.toFixed(2) }}</div>
                    </div>
                  </div>
                </div>
              </button>

              <!-- Quick Actions -->
              <div v-if="expandedBoxId === box.id" class="bg-primary/10 border-2 border-t-0 border-primary rounded-none p-3">
                <div class="flex gap-2 justify-center flex-wrap">
                  <button
                    @click.stop="add(box, 'current')"
                    class="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-primary-foreground rounded-none transition-colors text-sm font-medium"
                  >
                    <Plus class="w-4 h-4" />
                    Current Transaction
                  </button>
                  <button
                    @click.stop="add(box, 'new')"
                    class="flex items-center gap-2 px-4 py-2 bg-card border-2 border-primary/40 text-primary rounded-none text-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <FileEdit class="w-4 h-4" />
                    New Transaction
                  </button>
                  <button
                    @click.stop="notify('Relabel')"
                    class="flex items-center gap-2 px-4 py-2 bg-card border-2 border-primary/40 text-primary rounded-none text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <Tag class="w-4 h-4" />
                    Relabel
                  </button>
                  <button
                    @click.stop="notify('Test Order')"
                    class="flex items-center gap-2 px-4 py-2 bg-card border-2 border-primary/40 text-primary rounded-none text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <TestTube2 class="w-4 h-4" />
                    Test Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Results -->
        <div v-if="filteredCustomers.length > 0" class="border-b-2 border-border">
          <div class="sticky top-0 bg-muted px-4 py-3 flex items-center justify-between gap-2 border-b border-border z-10">
            <div class="flex items-center gap-2">
              <User class="w-5 h-5 text-muted-foreground" />
              <h4 class="text-sm font-bold text-foreground">Customers ({{ filteredCustomers.length }})</h4>
            </div>
            <button
              v-if="!customersOnly"
              @click="emit('view-all-customers'); emit('close')"
              class="text-xs text-primary hover:underline font-bold uppercase tracking-wider"
            >
              View All
            </button>
          </div>
          <div class="p-2">
            <div
              v-for="customer in filteredCustomers"
              :key="customer.id"
              @click="emit('view-customer', customer); emit('close')"
              class="mb-1 flex items-center justify-between p-3 border-2 border-transparent hover:border-primary/50 hover:bg-muted transition-colors rounded-none cursor-pointer group"
            >
              <div class="flex-1">
                <div class="font-medium text-base mb-0.5 text-foreground group-hover:text-primary transition-colors">{{ customer.name }}</div>
                <div class="text-xs text-muted-foreground">{{ customer.email }} • {{ customer.phone }}</div>
              </div>

              <button
                @click.stop="emit('attach-customer', customer); emit('close')"
                class="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-primary-foreground rounded-none transition-colors text-sm font-semibold z-20"
              >
                <Plus class="w-4 h-4" />
                Attach to Transaction
              </button>
            </div>
          </div>
        </div>

        <!-- Order Results -->
        <div v-if="!customersOnly && filteredOrders.length > 0">
          <div class="sticky top-0 bg-muted px-4 py-3 flex items-center gap-2 border-b border-border z-10">
            <ShoppingBag class="w-5 h-5 text-muted-foreground" />
            <h4 class="text-sm font-bold text-foreground">Orders ({{ filteredOrders.length }})</h4>
          </div>
          <div class="p-2">
            <button
              v-for="order in filteredOrders"
              :key="order.id"
              class="w-full p-3 hover:bg-muted rounded-none transition-colors text-left border-2 border-transparent hover:border-border mb-1"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-medium text-base mb-0.5 text-foreground">{{ order.orderNumber }}</div>
                  <div class="text-xs text-muted-foreground">{{ order.customer }} • {{ order.date }}</div>
                </div>
                <div class="text-right flex items-center gap-2">
                  <div class="text-sm font-bold text-foreground">£{{ order.total.toFixed(2) }}</div>
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs rounded-none capitalize',
                      order.type === 'sell' ? 'bg-[#34D399]/20 text-[#34D399]' : order.type === 'buy' ? 'bg-[#A78BFA]/20 text-[#A78BFA]' : 'bg-[#60A5FA]/20 text-[#60A5FA]'
                    ]"
                  >
                    {{ order.type }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Package, User, ShoppingBag, Plus, FileEdit, ChevronDown, Check, Tag, TestTube2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { TransactionItem } from '../types'
import type { BoxResult, CustomerResult, OrderResult } from './SearchResultsTypes'

const props = withDefaults(defineProps<{
  query: string
  customers?: CustomerResult[]
  boxes?: BoxResult[]
  orders?: OrderResult[]
  customersOnly?: boolean
}>(), { customers: () => [], boxes: () => [], orders: () => [], customersOnly: false })

const emit = defineEmits<{
  close: []
  'add-to-current-transaction': [item: TransactionItem]
  'add-to-new-transaction': [item: TransactionItem]
  'attach-customer': [customer: CustomerResult]
  'view-customer': [customer: CustomerResult]
  'view-all-customers': []
}>()

const category = ref('')
const status = ref('')
const availability = ref('')
const showDiscontinued = ref(false)
const showDeleted = ref(false)
const expandedBoxId = ref<string | null>(null)

const searchLower = computed(() => props.query.toLowerCase())
const hasQuery = computed(() => props.query.trim().length > 0)

const filterCategories = computed(() => {
  const cats = [...new Set(props.boxes.map((b) => b.category.trim()).filter(Boolean))]
  return cats.length ? cats : ['Gaming', 'Computing', 'Phones', 'Audio']
})

const filteredBoxes = computed(() => props.boxes.filter((box) => {
  const q = searchLower.value
  const matchesSearch =
    box.name.toLowerCase().includes(q) ||
    box.boxId.toLowerCase().includes(q) ||
    box.category.toLowerCase().includes(q)
  if (!matchesSearch) return false

  if (category.value && !box.category.toLowerCase().includes(category.value)) return false
  if (status.value && box.status !== status.value) return false

  if (availability.value === 'instock' && box.stockLevel <= 0) return false
  if (availability.value === 'outofstock' && box.stockLevel > 0) return false
  if (availability.value === 'lowstock' && (box.stockLevel > 3 || box.stockLevel === 0)) return false

  if (status.value !== 'discontinued' && !showDiscontinued.value && box.status === 'discontinued') return false
  if (status.value !== 'deleted' && !showDeleted.value && box.status === 'deleted') return false

  return true
}))

const filteredCustomers = computed(() => props.customers.filter((c) => {
  const q = searchLower.value
  return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(props.query)
}))

const filteredOrders = computed(() => props.orders.filter((o) => {
  const q = searchLower.value
  return o.orderNumber.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
}))

const hasResults = computed(() =>
  props.customersOnly
    ? filteredCustomers.value.length > 0
    : filteredBoxes.value.length > 0 || filteredCustomers.value.length > 0 || filteredOrders.value.length > 0
)

function add(box: BoxResult, target: 'current' | 'new') {
  const item: TransactionItem = {
    id: box.id,
    boxName: box.name,
    stockLevel: box.stockLevel,
    category: box.category,
    boxId: box.boxId,
    type: 'sell',
    price: box.sellPrice,
    qty: 1,
    requiresSerial: box.requiresSerial,
  }
  if (target === 'new') emit('add-to-new-transaction', item)
  else emit('add-to-current-transaction', item)
  emit('close')
}

function notify(action: string) {
  toast.info(action)
}
</script>
