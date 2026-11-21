<template>
  <div class="page">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green"><CheckCircle2 :size="22" /></div>
        <div>
          <div class="stat-label">Healthy</div>
          <div class="stat-value">{{ stats.healthy.length }}</div>
          <div class="stat-hint">Above threshold</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber"><AlertTriangle :size="22" /></div>
        <div>
          <div class="stat-label">Low stock</div>
          <div class="stat-value">{{ stats.low.length }}</div>
          <div class="stat-hint">Needs restock</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><Package :size="22" /></div>
        <div>
          <div class="stat-label">Out of stock</div>
          <div class="stat-value">{{ stats.out.length }}</div>
          <div class="stat-hint">Sold out</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><Package :size="22" /></div>
        <div>
          <div class="stat-label">Inventory value</div>
          <div class="stat-value">{{ formatMoney(stats.stockValue, cur) }}</div>
          <div class="stat-hint">At cost</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div class="search" style="flex:1;min-width:220px">
        <Search :size="16" />
        <input placeholder="Search inventory…" v-model="query" style="width:100%" />
      </div>
      <div class="segmented">
        <button v-for="f in filters" :key="f" :class="{ active: filter === f }" @click="filter = f">
          {{ f === 'all' ? 'All' : f === 'low' ? 'Low' : f === 'out' ? 'Out' : 'Healthy' }}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th class="num">Grade</th>
              <th class="num">Cost</th>
              <th class="num">Price</th>
              <th class="num">Stock</th>
              <th>Status</th>
              <th class="num">Stock value</th>
              <th class="num">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id">
              <td>
                <div class="product-cell">
                  <div class="product-thumb">
                    <img v-if="p.image.startsWith('data:')" :src="p.image" alt="" />
                    <span v-else>📦</span>
                  </div>
                  <div>
                    <div class="name">{{ p.name }}</div>
                    <div class="sku">{{ p.sku }}</div>
                  </div>
                </div>
              </td>
              <td>{{ catName(p.categoryId) }}</td>
              <td class="num">
                <span v-if="p.grade" :class="['grade-badge', `grade-${p.grade.toLowerCase()}`]">{{ p.grade }}</span>
                <span v-else>—</span>
              </td>
              <td class="num" style="color:var(--text-faint)">{{ formatMoney(p.cost, cur) }}</td>
              <td class="num">{{ formatMoney(p.price, cur) }}</td>
              <td class="num" style="font-weight:700">{{ p.stock }}</td>
              <td><span :class="['badge', status(p).cls]">{{ status(p).label }}</span></td>
              <td class="num">{{ formatMoney(p.stock * p.cost, cur) }}</td>
              <td class="num">
                <button class="btn btn-soft btn-sm" @click="restocking = p"><Plus :size="13" /> Restock</button>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <div class="es-icon"><Search :size="24" /></div>
                  <p>No inventory matches</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal :open="!!restocking" :title="restocking ? `Restock ${restocking.name}` : ''" @close="restocking = null">
      <template v-if="restocking">
        <div class="stat-card" style="margin-bottom:16px;box-shadow:none;background:var(--surface-2)">
          <div class="stat-icon indigo"><Package :size="22" /></div>
          <div>
            <div class="stat-label">Current stock</div>
            <div class="stat-value">{{ restocking.stock }}</div>
          </div>
        </div>
        <div class="field">
          <label>Quantity to add</label>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-ghost btn-icon" @click="qty = Math.max(0, qty - 5)"><Minus :size="16" /></button>
            <input class="input" type="number" min="0" v-model.number="qty" style="text-align:center;font-weight:700;font-size:16px" />
            <button class="btn btn-ghost btn-icon" @click="qty = qty + 5"><Plus :size="16" /></button>
          </div>
        </div>
        <div style="font-size:12.5px;color:var(--text-faint)">
          New total: <b style="color:var(--text)">{{ restocking.stock + qty }}</b>
        </div>
      </template>
      <template #footer>
        <button class="btn btn-ghost" @click="restocking = null">Cancel</button>
        <button class="btn btn-primary" @click="confirmRestock"><Plus :size="15" /> Add stock</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, Package, AlertTriangle, CheckCircle2, Minus, Plus } from 'lucide-vue-next'
import { useStore } from '../store/useStore'
import { formatMoney } from '../utils/format'
import type { Product } from '../types'
import Modal from '../components/Modal.vue'

type Filter = 'all' | 'low' | 'out' | 'healthy'
const filters: Filter[] = ['all', 'low', 'out', 'healthy']

const store = useStore()
const products = computed(() => store.products)
const categories = computed(() => store.categories)
const cur = computed(() => store.settings.currency)

const query = ref('')
const filter = ref<Filter>('all')
const restocking = ref<Product | null>(null)
const qty = ref(0)

watch(restocking, (v) => { if (v) qty.value = 0 })

const stats = computed(() => {
  const list = products.value
  const low = list.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold)
  const out = list.filter((p) => p.stock <= 0)
  const healthy = list.filter((p) => p.stock > p.lowStockThreshold)
  const stockValue = list.reduce((s, p) => s + p.stock * p.cost, 0)
  return { low, out, healthy, stockValue }
})

const filtered = computed(() => {
  return products.value.filter((p) => {
    const q = query.value.trim().toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    let matchF = true
    if (filter.value === 'low') matchF = p.stock > 0 && p.stock <= p.lowStockThreshold
    else if (filter.value === 'out') matchF = p.stock <= 0
    else if (filter.value === 'healthy') matchF = p.stock > p.lowStockThreshold
    return matchQ && matchF
  })
})

function status(p: Product) {
  if (p.stock <= 0) return { label: 'Out of stock', cls: 'badge-red' }
  if (p.stock <= p.lowStockThreshold) return { label: 'Low', cls: 'badge-amber' }
  return { label: 'In stock', cls: 'badge-green' }
}
function catName(id: string) { return categories.value.find((c) => c.id === id)?.name ?? '—' }

function confirmRestock() {
  const p = restocking.value
  if (!p) return
  if (qty.value <= 0) return store.pushToast('error', 'Enter a quantity greater than 0')
  store.updateProduct(p.id, { stock: p.stock + qty.value })
  store.pushToast('success', `${qty.value} × ${p.name} added to stock`)
  restocking.value = null
}
</script>
