<template>
  <div class="page">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon indigo"><TrendingUp :size="22" /></div>
        <div>
          <div class="stat-label">Revenue</div>
          <div class="stat-value">{{ formatMoney(totals.revenue, cur) }}</div>
          <div class="stat-hint">{{ totals.count }} sales</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cyan"><Receipt :size="22" /></div>
        <div>
          <div class="stat-label">Avg. order</div>
          <div class="stat-value">{{ formatMoney(totals.avg, cur) }}</div>
          <div class="stat-hint">Tax included</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><TrendingUp :size="22" /></div>
        <div>
          <div class="stat-label">Units sold</div>
          <div class="stat-value">{{ totals.units }}</div>
          <div class="stat-hint">{{ formatMoney(totals.subtotal, cur) }} pre-tax</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber"><TrendingDown :size="22" /></div>
        <div>
          <div class="stat-label">Tax collected</div>
          <div class="stat-value">{{ formatMoney(totals.tax, cur) }}</div>
          <div class="stat-hint">At {{ settings.taxRate }}%</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between">
      <div class="segmented">
        <button v-for="r in ranges" :key="r" :class="{ active: range === r }" @click="range = r">
          {{ r === 'all' ? 'All time' : cap(r) }}
        </button>
      </div>
      <div class="segmented">
        <button v-for="m in methods" :key="m" :class="{ active: method === m }" @click="method = m">
          {{ m === 'all' ? 'All methods' : (PAYMENT_ICONS[m] || '') + ' ' + cap(m) }}
        </button>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card dash-span-8">
        <div class="card-header">
          <div>
            <h3>Transactions</h3>
            <div class="sub">{{ totals.count }} sales in view</div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Items</th>
                <th>Payment</th>
                <th class="num">Total</th>
                <th class="num"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sortedFiltered" :key="s.id" @click="viewing = s" style="cursor:pointer">
                <td><b>#{{ s.receiptNo }}</b></td>
                <td>{{ formatDateTime(s.createdAt) }}</td>
                <td>{{ customerName(s.customerId) }}</td>
                <td>
                  <span :class="['badge', kindBadge(s.kind)]" style="text-transform:capitalize">{{ s.kind }}</span>
                </td>
                <td>{{ s.items.reduce((n, it) => n + it.qty, 0) }}</td>
                <td>
                  <span class="badge badge-gray">{{ PAYMENT_ICONS[s.paymentMethod] }} {{ paymentSummary(s) }}</span>
                </td>
                <td class="num" :style="{ fontWeight: 700, color: s.total < 0 ? 'var(--danger)' : undefined }">{{ formatMoney(s.total, cur) }}</td>
                <td class="num">
                  <button class="btn-icon btn-ghost btn-sm" @click.stop="viewing = s"><Printer :size="14" /></button>
                </td>
              </tr>
              <tr v-if="filtered.length === 0">
                <td colspan="8">
                  <div class="empty-state">
                    <div class="es-icon"><Receipt :size="24" /></div>
                    <p>No transactions in this view yet — all buy, sell and exchange transactions appear here</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card dash-span-4">
        <div class="card-header">
          <div>
            <h3>Top products</h3>
            <div class="sub">By revenue in view</div>
          </div>
        </div>
        <div class="simple-list">
          <div v-if="topProducts.length === 0" class="empty-state"><p>No data yet</p></div>
          <div v-for="(tp, i) in topProducts" :key="tp.name" class="sl-row">
            <div class="sl-thumb" style="background:var(--primary-soft);color:var(--primary);font-weight:800">{{ i + 1 }}</div>
            <div class="sl-info">
              <div class="sl-name">{{ tp.name }}</div>
              <div class="sl-sub">{{ tp.qty }} units</div>
            </div>
            <div class="sl-right">
              <div class="sl-value">{{ formatMoney(tp.revenue, cur) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal :open="!!viewing" :title="`Receipt #${viewing?.receiptNo ?? ''}`" @close="viewing = null">
      <div v-if="viewing" class="print-area">
        <ReceiptView :sale="viewing" />
      </div>
      <template #footer>
        <button v-if="viewing" class="btn btn-primary" @click="print"><Printer :size="16" /> Print</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Printer, TrendingUp, TrendingDown, Receipt } from 'lucide-vue-next'
import { useStore } from '../store/useStore'
import { formatMoney, startOfDay, startOfWeek, startOfMonth, formatDateTime, paymentSummary } from '../utils/format'
import type { Sale } from '../types'
import Modal from '../components/Modal.vue'
import ReceiptView from '../components/Receipt.vue'

type Range = 'today' | 'week' | 'month' | 'all'
const ranges: Range[] = ['today', 'week', 'month', 'all']
const methods = ['all', 'cash', 'card', 'upi', 'credit'] as const
const PAYMENT_ICONS: Record<string, string> = { cash: '💵', card: '💳', upi: '📱', credit: '🏦' }

const store = useStore()
const settings = computed(() => store.settings)
const cur = computed(() => settings.value.currency)

const range = ref<Range>('today')
const method = ref<string>('all')
const viewing = ref<Sale | null>(null)

const filtered = computed(() => {
  const now = Date.now()
  let from = 0
  if (range.value === 'today') from = startOfDay(now)
  else if (range.value === 'week') from = startOfWeek(now)
  else if (range.value === 'month') from = startOfMonth(now)
  return store.sales.filter((s) => {
    if (s.createdAt < from) return false
    if (method.value !== 'all' && s.paymentMethod !== method.value) return false
    return true
  })
})

const sortedFiltered = computed(() => [...filtered.value].sort((a, b) => b.createdAt - a.createdAt))

const totals = computed(() => {
  const list = filtered.value
  const revenue = list.reduce((s, x) => s + x.total, 0)
  const subtotal = list.reduce((s, x) => s + x.subtotal, 0)
  const tax = list.reduce((s, x) => s + x.taxAmount, 0)
  const units = list.reduce((s, x) => s + x.items.reduce((n, it) => n + it.qty, 0), 0)
  const avg = list.length ? revenue / list.length : 0
  return { revenue, subtotal, tax, units, avg, count: list.length }
})

const topProducts = computed(() => {
  const m = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const s of filtered.value)
    for (const it of s.items) {
      const e = m.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 }
      e.qty += it.qty
      e.revenue += it.qty * it.price
      m.set(it.productId, e)
    }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
})

function customerName(id?: string) {
  if (!id) return '—'
  return store.customers.find((c) => c.id === id)?.name ?? '—'
}
function cap(s: string) { return s[0].toUpperCase() + s.slice(1) }
function kindBadge(kind: string) {
  if (kind === 'buy') return 'badge-purple'
  if (kind === 'exchange') return 'badge-blue'
  if (kind === 'refund') return 'badge-red'
  return 'badge-green'
}
function print() { window.print() }
</script>
