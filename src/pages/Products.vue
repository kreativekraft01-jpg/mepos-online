<template>
  <div class="page">
    <div class="section-head">
      <div>
        <h2>Products</h2>
        <div class="sub">{{ store.products.length }} items · {{ store.categories.length }} categories</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" @click="catOpen = true"><Tags :size="16" /> Categories</button>
        <button class="btn btn-primary" @click="openNew"><Plus :size="16" /> Add product</button>
      </div>
    </div>

    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div class="search" style="flex:1;min-width:220px">
        <Search :size="16" />
        <input placeholder="Search by name or SKU…" v-model="query" style="width:100%" />
      </div>
      <select class="select" v-model="catFilter" style="width:180px">
        <option value="all">All categories</option>
        <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th class="num">Grade</th>
              <th class="num">Price</th>
              <th class="num">Cost</th>
              <th class="num">Stock</th>
              <th class="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id">
              <td>
                <div class="product-cell">
                  <div class="product-thumb">
                    <img v-if="p.image.startsWith('data:')" :src="p.image" alt="" />
                    <ImageIcon v-else :size="16" />
                  </div>
                  <div>
                    <div class="name">{{ p.name }}</div>
                    <div class="sku">{{ p.sku }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :style="{ background: `${catById(p.categoryId)?.color ?? '#888'}1a`, color: catById(p.categoryId)?.color ?? '#666' }">
                  {{ catById(p.categoryId)?.name ?? '—' }}
                </span>
              </td>
              <td class="num">
                <span v-if="p.grade" :class="['grade-badge', `grade-${p.grade.toLowerCase()}`]">{{ p.grade }}</span>
                <span v-else>—</span>
              </td>
              <td class="num">{{ formatMoney(p.price, cur) }}</td>
              <td class="num" style="color:var(--text-faint)">{{ formatMoney(p.cost, cur) }}</td>
              <td class="num">
                <span v-if="p.stock <= p.lowStockThreshold" class="badge badge-amber">{{ p.stock }}</span>
                <span v-else>{{ p.stock }}</span>
              </td>
              <td class="num">
                <div style="display:inline-flex;gap:6px">
                  <button class="btn-icon btn-ghost" @click="openEdit(p)" title="Edit"><Pencil :size="15" /></button>
                  <button class="btn-icon btn-ghost" style="color:var(--danger)" @click="deleting = p" title="Delete"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="7">
                <div class="empty-state">
                  <div class="es-icon"><Search :size="24" /></div>
                  <p>No products found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Product Modal -->
    <Modal :open="!!editing" :title="editingId ? 'Edit product' : 'Add product'" :wide="true" @close="editing = false">
      <div v-if="error" style="background:var(--danger-soft);color:#b91c1c;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;font-weight:600">{{ error }}</div>
      <div class="form-row">
        <div class="field"><label>Product name <span class="req">*</span></label><input class="input" v-model="form.name" placeholder="e.g. iPhone 15 · 128GB" /></div>
        <div class="field"><label>SKU</label><input class="input" v-model="form.sku" placeholder="Auto-generated if empty" /></div>
      </div>
      <div class="form-row">
        <div class="field">
          <label>Category</label>
          <select class="select" v-model="form.categoryId">
            <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>Condition grade</label>
          <select class="select" v-model="form.grade">
            <option v-for="g in grades" :key="g" :value="g">Grade {{ g }}</option>
          </select>
        </div>
        <div class="field"><label>Image URL or emoji</label><input class="input" v-model="form.image" placeholder="Paste an image URL or leave for auto" /></div>
      </div>
      <div class="field"><label>Description</label><textarea class="textarea" v-model="form.description" placeholder="Short description shown on receipts" /></div>
      <div class="form-grid-3">
        <div class="field"><label>Price ({{ cur }})</label><input class="input" type="number" min="0" step="0.01" v-model.number="form.price" /></div>
        <div class="field"><label>Cost ({{ cur }})</label><input class="input" type="number" min="0" step="0.01" v-model.number="form.cost" /></div>
        <div class="field"><label>Stock</label><input class="input" type="number" min="0" v-model.number="form.stock" /></div>
      </div>
      <div class="field" style="max-width:220px"><label>Low stock alert at</label><input class="input" type="number" min="0" v-model.number="form.lowStockThreshold" /></div>
      <template #footer>
        <button class="btn btn-ghost" @click="editing = false">Cancel</button>
        <button class="btn btn-primary" @click="saveProduct">{{ editingId ? 'Save changes' : 'Add product' }}</button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deleting"
      title="Delete product"
      :message="`Delete &quot;${deleting?.name ?? ''}&quot;? This cannot be undone.`"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />

    <!-- Category Modal -->
    <Modal :open="catOpen" title="Manage categories" @close="catOpen = false">
      <div class="form-row" style="margin-bottom:18px">
        <div class="field">
          <label>New category name</label>
          <input class="input" v-model="catName" @keydown.enter="addCategory" placeholder="e.g. Organic" />
        </div>
        <div class="field">
          <label>Color</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;padding-top:4px">
            <button v-for="c in CATEGORY_COLORS" :key="c" @click="catColor = c"
              :style="{ width: '26px', height: '26px', borderRadius: '8px', background: c, border: catColor === c ? '2px solid var(--text)' : '2px solid transparent', transform: catColor === c ? 'scale(1.1)' : 'none' }" />
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" @click="addCategory" style="margin-bottom:16px"><Plus :size="14" /> Add category</button>
      <div class="simple-list" style="border:1px solid var(--border);border-radius:12px;max-height:320px;overflow-y:auto">
        <div v-for="c in store.categories" :key="c.id" class="sl-row">
          <span class="chip-dot" :style="{ width: '12px', height: '12px', background: c.color, borderRadius: '4px', flexShrink: '0' }"></span>
          <div class="sl-info">
            <div class="sl-name">{{ c.name }}</div>
            <div class="sl-sub">{{ store.products.filter((p) => p.categoryId === c.id).length }} products</div>
          </div>
          <input type="color" :value="c.color" @input="(e:any)=>store.updateCategory(c.id,{color:e.target.value})" style="width:28px;height:28px;border:none;background:none;cursor:pointer" title="Change color" />
          <button class="btn-icon btn-ghost" style="color:var(--danger)" @click="removeCategory(c.id)"><Trash2 :size="15" /></button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Search, Pencil, Trash2, Tags, ImageIcon } from 'lucide-vue-next'
import { useStore } from '../store/useStore'
import { formatMoney } from '../utils/format'
import { REFURB_GRADES, type Product } from '../types'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useStore()
const route = useRoute()
const cur = computed(() => store.settings.currency)
const grades = REFURB_GRADES

const query = ref((route.query.q as string) ?? '')
watch(() => route.query.q, (q) => { query.value = (q as string) ?? '' })
const catFilter = ref('all')
const deleting = ref<Product | null>(null)
const catOpen = ref(false)

const CATEGORY_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
const catName = ref('')
const catColor = ref(CATEGORY_COLORS[0])

const filtered = computed(() => {
  return store.products.filter((p) => {
    const q = query.value.trim().toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const matchC = catFilter.value === 'all' || p.categoryId === catFilter.value
    return matchQ && matchC
  })
})

function catById(id: string) { return store.categories.find((c) => c.id === id) }
function confirmDelete() {
  if (deleting.value) {
    store.deleteProduct(deleting.value.id)
    store.pushToast('success', `${deleting.value.name} deleted`)
    deleting.value = null
  }
}

// product form
const editing = ref(false)
const editingId = ref<string | null>(null)
const error = ref('')
const form = reactive({
  sku: '', name: '', description: '', categoryId: '', grade: 'A',
  price: 0, cost: 0, stock: 0, lowStockThreshold: 10, image: ''
})
function resetForm(p?: Product | null) {
  form.sku = p?.sku ?? ''
  form.name = p?.name ?? ''
  form.description = p?.description ?? ''
  form.categoryId = p?.categoryId ?? store.categories[0]?.id ?? ''
  form.grade = p?.grade ?? 'A'
  form.price = p?.price ?? 0
  form.cost = p?.cost ?? 0
  form.stock = p?.stock ?? 0
  form.lowStockThreshold = p?.lowStockThreshold ?? 10
  form.image = p?.image ?? ''
  error.value = ''
}
function openNew() { editingId.value = null; resetForm(null); editing.value = true }
function openEdit(p: Product) { editingId.value = p.id; resetForm(p); editing.value = true }

function emojiFor(name: string): string {
  const n = name.toLowerCase()
  const map: Array<[RegExp, string]> = [
    [/iphone|phone|pixel|galaxy|samsung|huawei|oneplus|motorola|xiaomi/, '📱'],
    [/macbook/, '💻'],
    [/laptop|chromebook|thinkpad|elitebook|surface|notebook/, '💻'],
    [/ipad|tablet/, '📲'],
    [/airpods|earbud|earphone|headphone|headset/, '🎧'],
    [/speaker|jbl|soundbar/, '🔊'],
    [/watch|wearable|fitbit|garmin/, '⌚'],
    [/playstation|ps5|ps4|xbox|switch|nintendo|console|controller/, '🎮'],
    [/camera|canon|nikon|dslr|mirrorless/, '📷'],
    [/drone|dji|mavic/, '🚁'],
    [/monitor|screen|display|tv/, '🖥️'],
  ]
  for (const [re, em] of map) if (re.test(n)) return dataUri(em)
  return dataUri('🛒')
}
function dataUri(emo: string): string {
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23f1f5f9'/><text x='50' y='62' font-size='46' text-anchor='middle'>${emo}</text></svg>`
}

function saveProduct() {
  error.value = ''
  if (!form.name.trim()) { error.value = 'Product name is required'; return }
  if (form.price < 0 || form.cost < 0 || form.stock < 0) { error.value = 'Prices and stock cannot be negative'; return }
  const finalSku = form.sku.trim() || `P-${Math.floor(1000 + Math.random() * 9000)}`
  const skuTaken = store.products.some((p) => p.sku.toLowerCase() === finalSku.toLowerCase() && p.id !== editingId.value)
  if (skuTaken) { error.value = `SKU "${finalSku}" is already in use`; return }
  const image = form.image.trim()
    ? (form.image.startsWith('data:') || form.image.startsWith('http') ? form.image : form.image)
    : emojiFor(form.name)
  const payload = { sku: finalSku, name: form.name, description: form.description, categoryId: form.categoryId, grade: form.grade, price: form.price, cost: form.cost, stock: form.stock, lowStockThreshold: form.lowStockThreshold, image }
  if (editingId.value) {
    store.updateProduct(editingId.value, payload)
    store.pushToast('success', `${form.name} updated`)
  } else {
    store.addProduct(payload)
    store.pushToast('success', `${form.name} added to catalog`)
  }
  editing.value = false
}

function addCategory() {
  if (!catName.value.trim()) return
  store.addCategory(catName.value.trim(), catColor.value)
  store.pushToast('success', `Category "${catName.value.trim()}" added`)
  catName.value = ''
}
function removeCategory(id: string) {
  store.deleteCategory(id)
  store.pushToast('info', 'Category removed, products moved to Uncategorized')
}
</script>
