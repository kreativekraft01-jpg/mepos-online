<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
    <div class="bg-card rounded-[4px] w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
      <!-- Header with Title, Tabs and Filters -->
      <div class="p-6 border-b border-border bg-muted/20">
        <div class="flex items-center justify-between gap-6 mb-4">
          <h2 class="text-2xl font-bold whitespace-nowrap text-[rgb(202,207,214)]">Recent Transactions</h2>
          <button @click="$emit('close')" class="p-2 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Tabs and Filters Row -->
        <div class="flex items-center gap-4 flex-wrap">
          <!-- Tabs - Switch Style -->
          <div class="relative bg-muted rounded-[4px] p-1 flex shrink-0">
            <button
              @click="activeTab = 'processed'"
              :class="['px-6 py-2 text-sm font-medium rounded-sm transition-all relative z-10', activeTab === 'processed' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground']"
            >
              Processed ({{ orders.length }})
            </button>
            <button
              @click="activeTab = 'unprocessed'"
              :class="['px-6 py-2 text-sm font-medium rounded-sm transition-all relative z-10', activeTab === 'unprocessed' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground']"
            >
              Unprocessed ({{ unprocessed.length }})
            </button>
            <div
              class="absolute top-1 bottom-1 rounded-sm transition-all duration-300 bg-primary"
              :style="{ left: activeTab === 'processed' ? '4px' : '50%', right: activeTab === 'processed' ? '50%' : '4px' }"
            />
          </div>

          <!-- Date Range -->
          <div class="flex-1 min-w-[160px] relative">
            <select v-model="dateRange" class="w-full px-3 py-2 pr-10 border-2 border-border rounded-sm text-sm bg-card text-foreground cursor-pointer hover:border-primary focus:outline-none focus:border-primary appearance-none">
              <option value="" disabled>Date Range</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronDown class="w-4 h-4" /></div>
          </div>

          <!-- Staff Member -->
          <div class="flex-1 min-w-[160px] relative">
            <select v-model="selectedStaff" class="w-full px-4 py-2 pr-10 border-2 border-border rounded-sm text-sm bg-card text-foreground cursor-pointer hover:border-primary focus:outline-none focus:border-primary appearance-none">
              <option value="" disabled>Staff Member</option>
              <option value="all">All Staff</option>
              <option v-for="name in staffOptions" :key="name" :value="name">{{ name }}</option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronDown class="w-4 h-4" /></div>
          </div>

          <!-- Float Number -->
          <div class="flex-1 min-w-[160px] relative">
            <select v-model="selectedFloat" class="w-full px-4 py-2 pr-10 border-2 border-border rounded-sm text-sm bg-card text-foreground cursor-pointer hover:border-primary focus:outline-none focus:border-primary appearance-none">
              <option value="" disabled>Float Number</option>
              <option value="all">All Floats</option>
              <option v-for="name in floatOptions" :key="name" :value="name">{{ name }}</option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronDown class="w-4 h-4" /></div>
          </div>
        </div>
      </div>

      <!-- Transaction Grid -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="bg-card rounded-[4px] border-2 border-border overflow-hidden">
          <table class="w-full">
            <thead class="bg-muted border-b border-border">
              <tr>
                <th class="p-4 text-left text-sm font-medium w-12 text-muted-foreground"></th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Order #</th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">
                  <button @click="dateSort = dateSort === 'desc' ? 'asc' : 'desc'" class="flex items-center gap-1 hover:text-foreground transition-colors" :title="dateSort === 'desc' ? 'Newest first — click to show oldest first' : 'Oldest first — click to show newest first'">
                    Date & Time
                    <component :is="dateSort === 'desc' ? ChevronDown : ChevronUp" class="w-4 h-4" />
                  </button>
                </th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Staff</th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Float</th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Type</th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Qty</th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Total</th>
                <th class="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="currentData.length === 0" class="border-b border-border">
                <td colspan="9" class="p-12 text-center text-base text-muted-foreground">No {{ activeTab === 'processed' ? 'processed' : 'unprocessed' }} transactions to show.</td>
              </tr>
              <template v-for="transaction in currentData" :key="transaction.orderNumber">
                <tr class="border-b border-border group hover:bg-muted/50 transition-colors">
                  <td class="p-4">
                    <button @click="toggleRow(transaction.orderNumber)" class="p-1 hover:bg-muted rounded-sm transition-colors text-muted-foreground group-hover:text-foreground">
                      <component :is="expandedRows.has(transaction.orderNumber) ? ChevronUp : ChevronDown" class="w-5 h-5" />
                    </button>
                  </td>
                  <td class="p-4"><span class="font-medium text-base text-[rgb(202,207,214)]">{{ transaction.orderNumber }}</span></td>
                  <td class="p-4 text-base text-muted-foreground">{{ transaction.dateTime }}</td>
                  <td class="p-4 text-base text-muted-foreground">{{ transaction.staff }}</td>
                  <td class="p-4 text-base text-muted-foreground">{{ transaction.float }}</td>
                  <td class="p-4">
                    <span :class="['px-3 py-1 rounded-sm text-sm font-medium capitalize', getOrderTypeColor(transaction.orderType)]">{{ transaction.orderType }}</span>
                  </td>
                  <td class="p-4 text-base text-muted-foreground">{{ transaction.qty }}</td>
                  <td :class="['p-4 text-base font-bold', getOrderTextColor(transaction.orderType)]">£{{ transaction.total.toFixed(2) }}</td>
                  <td class="p-4">
                    <div v-if="activeTab === 'processed'" class="flex gap-2 items-center">
                      <div class="flex gap-1 mr-2 border-r border-border pr-2">
                        <button class="p-3 hover:bg-primary/10 rounded-sm transition-colors group/btn" title="Print Label" @click="toast.info('Printing label')">
                          <Printer class="w-6 h-6 text-primary" />
                        </button>
                        <button class="p-3 hover:bg-primary/10 rounded-sm transition-colors group/btn" title="Reprint Receipt" @click="toast.info('Reprinting receipt')">
                          <FileText class="w-6 h-6 text-primary" />
                        </button>
                      </div>
                      <div class="relative">
                        <button class="p-3 hover:bg-muted rounded-sm transition-colors" title="More Actions" @click.stop="toggleMenu(transaction.orderNumber)">
                          <MoreVertical class="w-6 h-6 text-muted-foreground hover:text-foreground" />
                        </button>
                        <div v-if="openMenu === transaction.orderNumber" class="absolute right-0 mt-1 w-56 bg-card border border-border text-foreground shadow-xl z-50 p-1">
                          <button class="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted text-left" @click="menuAction('info', 'Reprinting Gift Receipt')">
                            <Gift class="w-5 h-5 text-purple-500" />
                            <span class="text-base">Reprint Gift Receipt</span>
                          </button>
                          <button class="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted text-left" @click="menuAction('info', 'Resubmitting FPS Request')">
                            <Send class="w-5 h-5 text-orange-500" />
                            <span class="text-base">Resubmit FPS Request</span>
                          </button>
                          <button class="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted text-left" @click="menuAction('warning', 'Initiating Refund')">
                            <RotateCcw class="w-5 h-5 text-destructive" />
                            <span class="text-base">Refund</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      v-else
                      @click="$emit('restore-transaction', transaction.orderNumber)"
                      class="px-4 py-2 bg-primary hover:bg-primary text-black rounded-sm flex items-center gap-2 transition-colors"
                      title="Restore to cart"
                    >
                      <ShoppingCart class="w-5 h-5" />
                    </button>
                  </td>
                </tr>

                <tr v-if="expandedRows.has(transaction.orderNumber)" class="bg-muted/20 border-b border-border">
                  <td colspan="9" class="p-6">
                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <h4 class="text-sm font-medium text-muted-foreground mb-2">Customer</h4>
                        <p class="text-base text-foreground">{{ transaction.customer || 'Walk-in Customer' }}</p>
                      </div>
                      <div v-if="transaction.items && transaction.items.length">
                        <h4 class="text-sm font-medium text-muted-foreground mb-2">Items</h4>
                        <div class="space-y-1">
                          <div v-for="(item, idx) in transaction.items" :key="idx" class="flex justify-between text-base text-foreground">
                            <span>{{ item.name }} × {{ item.qty }}</span>
                            <span :class="['font-medium', getOrderTextColor(transaction.orderType)]">£{{ item.price.toFixed(2) }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-else>
                        <h4 class="text-sm font-medium text-muted-foreground mb-2">Items</h4>
                        <p class="text-base text-muted-foreground">No item details.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { X, ChevronDown, ChevronUp, Printer, FileText, Gift, Send, RotateCcw, ShoppingCart, MoreVertical } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { OrderType, Transaction } from '../types'

const props = defineProps<{ orders: Transaction[]; unprocessed: Transaction[] }>()
defineEmits<{ close: []; 'restore-transaction': [orderNumber: string] }>()

const activeTab = ref<'processed' | 'unprocessed'>('processed')
const dateRange = ref('today')
const selectedStaff = ref('all')
const selectedFloat = ref('all')
const dateSort = ref<'asc' | 'desc'>('desc')
const expandedRows = reactive(new Set<string>())
const openMenu = ref<string | null>(null)

const staffOptions = computed(() => {
  const set = new Set<string>()
  ;[...props.orders, ...props.unprocessed].forEach((o) => { if (o.staff) set.add(o.staff) })
  return Array.from(set)
})

const floatOptions = computed(() => {
  const set = new Set<string>()
  ;[...props.orders, ...props.unprocessed].forEach((o) => { if (o.float) set.add(o.float) })
  return Array.from(set)
})

const currentData = computed(() => {
  const base = activeTab.value === 'processed' ? props.orders : props.unprocessed
  const filtered = base.filter(
    (o) =>
      (selectedStaff.value === 'all' || o.staff === selectedStaff.value) &&
      (selectedFloat.value === 'all' || o.float === selectedFloat.value)
  )
  const getTime = (t: Transaction) => {
    if (typeof t.createdAt === 'number') return t.createdAt
    const parsed = Date.parse(t.dateTime)
    if (!Number.isNaN(parsed)) return parsed
    const num = parseInt(t.orderNumber.replace(/\D/g, ''), 10)
    return Number.isNaN(num) ? 0 : num
  }
  return [...filtered].sort((a, b) => {
    const ta = getTime(a)
    const tb = getTime(b)
    return dateSort.value === 'desc' ? tb - ta : ta - tb
  })
})

function toggleRow(orderNumber: string) {
  if (expandedRows.has(orderNumber)) expandedRows.delete(orderNumber)
  else expandedRows.add(orderNumber)
}

function toggleMenu(orderNumber: string) {
  openMenu.value = openMenu.value === orderNumber ? null : orderNumber
}

function menuAction(kind: 'info' | 'warning', message: string) {
  openMenu.value = null
  if (kind === 'warning') toast.warning(message)
  else toast.info(message)
}

function getOrderTypeColor(type: OrderType) {
  switch (type) {
    case 'sell': return 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
    case 'buy': return 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20'
    case 'exchange': return 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20'
    case 'mixed': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
  }
}

function getOrderTextColor(type: OrderType) {
  switch (type) {
    case 'sell': return 'text-[#10B981]'
    case 'buy': return 'text-[#8B5CF6]'
    case 'exchange': return 'text-[#3B82F6]'
    case 'mixed': return 'text-orange-500'
    default: return 'text-foreground'
  }
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target && target.closest && target.closest('.relative')) return
  openMenu.value = null
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') openMenu.value = null
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKey)
})
</script>
