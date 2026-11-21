<template>
  <div class="page">
    <div class="section-head">
      <div>
        <h2>Good {{ greeting }} 👋</h2>
        <div class="sub">{{ todayStr }}</div>
      </div>
    </div>

    <div class="stats-grid">
      <StatCard label="Today's Revenue" :value="formatMoney(stats.revenue, cur)" :hint="stats.orders > 0 ? `${stats.orders} orders today` : 'No sales yet today'" color="indigo">
        <template #icon><DollarSign :size="22" /></template>
      </StatCard>
      <StatCard label="Avg. Order" :value="formatMoney(stats.avgOrder, cur)" :hint="trendHint" color="green">
        <template #icon><TrendingUp :size="22" /></template>
      </StatCard>
      <StatCard label="Total Revenue" :value="formatMoney(stats.totalRevenue, cur)" :hint="`${store.sales.length} lifetime sales`" color="cyan">
        <template #icon><ShoppingBag :size="22" /></template>
      </StatCard>
      <StatCard label="Low Stock" :value="stats.lowStock.length" :hint="`${products.length} products in catalog`" :color="stats.lowStock.length > 0 ? 'amber' : 'green'">
        <template #icon><Package :size="22" /></template>
      </StatCard>
    </div>

    <div class="dash-grid">
      <div class="card dash-span-8">
        <div class="card-header">
          <div>
            <h3>Revenue — last 7 days</h3>
            <div class="sub">Daily sales total</div>
          </div>
          <button class="btn btn-sm btn-ghost" style="margin-left:auto" @click="navigate('/admin/sales')">
            View reports <ArrowRight :size="14" />
          </button>
        </div>
        <div class="card-body">
          <div class="chart-bars">
            <div v-for="(b, i) in stats.buckets" :key="i" class="chart-col">
              <div :class="['chart-bar', { today: i === stats.buckets.length - 1 }]" :style="{ height: barHeight(b.total) }">
                <span class="tooltip">{{ formatMoney(b.total, cur) }}</span>
              </div>
              <div class="chart-label">{{ b.label.slice(0, 3) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card dash-span-4">
        <div class="card-header">
          <div>
            <h3>Low stock alerts</h3>
            <div class="sub">Restock soon</div>
          </div>
        </div>
        <div class="simple-list">
          <div v-if="stats.lowStock.length === 0" class="empty-state">
            <div class="es-icon"><Package :size="24" /></div>
            <p>All stock levels are healthy</p>
          </div>
          <div v-for="p in stats.lowStock.slice(0, 6)" :key="p.id" class="sl-row">
            <div class="sl-thumb">
              <img v-if="p.image.startsWith('data:')" :src="p.image" alt="" />
              <span v-else style="font-size:18px">📦</span>
            </div>
            <div class="sl-info">
              <div class="sl-name">
                {{ p.name }}
                <span v-if="p.grade" :class="['grade-badge', `grade-${p.grade.toLowerCase()}`]">{{ p.grade }}</span>
              </div>
              <div class="sl-sub">{{ catName(p.categoryId) }}</div>
            </div>
            <div class="sl-right">
              <div class="sl-value" style="color: var(--danger)">{{ p.stock }} left</div>
              <div class="sl-hint">threshold {{ p.lowStockThreshold }}</div>
            </div>
          </div>
        </div>
        <div v-if="stats.lowStock.length > 0" style="padding:12px 20px;border-top:1px solid var(--border)">
          <button class="btn btn-soft btn-sm" @click="navigate('/admin/inventory')">
            <AlertTriangle :size="14" /> Open inventory
          </button>
        </div>
      </div>
    </div>

    <div v-if="stats.topProduct" class="card">
      <div class="card-header">
        <div>
          <h3>⭐ Best seller</h3>
          <div class="sub">Most units sold across all time</div>
        </div>
      </div>
      <div class="card-body" style="display:flex;align-items:center;gap:14px">
        <div class="sl-thumb" style="width:52px;height:52px;font-size:26px">
          <img v-if="stats.topProduct.image.startsWith('data:')" :src="stats.topProduct.image" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px" />
          <span v-else>🏆</span>
        </div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:15px">{{ stats.topProduct.name }}</div>
          <div style="font-size:12.5px;color:var(--text-faint)">
            {{ formatMoney(stats.topProduct.price, cur) }} · {{ stats.topProduct.stock }} in stock
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="navigate('/')">
          Sell now <ArrowRight :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DollarSign, ShoppingBag, Package, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import { useStore } from '../store/useStore'
import { formatMoney, startOfDay, lastNDays } from '../utils/format'

const store = useStore()
const router = useRouter()
const navigate = (p: string) => router.push(p)

const products = computed(() => store.products)
const categories = computed(() => store.categories)
const cur = computed(() => store.settings.currency)

const greeting = computed(() => new Date().getHours() < 12 ? 'morning' : 'afternoon')
const todayStr = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))

const stats = computed(() => {
  const sales = store.sales
  const prods = store.products
  const today = startOfDay(Date.now())
  const todaySales = sales.filter((s) => s.createdAt >= today)
  const revenue = todaySales.reduce((sum, s) => sum + s.total, 0)
  const orders = todaySales.length
  const lowStock = prods.filter((p) => p.stock <= p.lowStockThreshold)
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)

  const itemCounts = new Map<string, number>()
  for (const s of sales) for (const it of s.items) itemCounts.set(it.productId, (itemCounts.get(it.productId) ?? 0) + it.qty)
  const topProductId = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const topProduct = prods.find((p) => p.id === topProductId)

  const days = 7
  const buckets: { label: string; total: number; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const dayStart = lastNDays(days - i)
    const dayEnd = dayStart + 86400000
    const daySales = sales.filter((s) => s.createdAt >= dayStart && s.createdAt < dayEnd)
    const d = new Date(dayStart)
    buckets.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      total: daySales.reduce((sum, s) => sum + s.total, 0),
      count: daySales.length
    })
  }

  const avgOrder = orders > 0 ? revenue / orders : 0
  const prevStart = lastNDays(days) - days * 86400000
  const prevTotal = sales
    .filter((s) => s.createdAt >= prevStart && s.createdAt < lastNDays(days))
    .reduce((sum, s) => sum + s.total, 0)
  const trend = prevTotal > 0 ? ((revenue - prevTotal) / prevTotal) * 100 : 0

  return { todaySales, revenue, orders, avgOrder, lowStock, totalRevenue, topProduct, buckets, trend }
})

const maxBucket = computed(() => Math.max(...stats.value.buckets.map((b) => b.total), 1))
function barHeight(total: number) {
  const height = Math.max((total / maxBucket.value) * 100, total > 0 ? 6 : 2)
  return `${height}%`
}
const trendHint = computed(() => {
  const t = stats.value.trend
  return t >= 0 ? `▲ ${Math.abs(t).toFixed(0)}% vs last week` : `▼ ${Math.abs(t).toFixed(0)}% vs last week`
})
function catName(id: string) {
  return categories.value.find((c) => c.id === id)?.name ?? 'Uncategorized'
}
</script>
