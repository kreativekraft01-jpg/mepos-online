<template>
  <div class="page">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon indigo"><Wallet :size="22" /></div>
        <div>
          <div class="stat-label">Customers</div>
          <div class="stat-value">{{ store.customers.length }}</div>
          <div class="stat-hint">Saved accounts</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><Wallet :size="22" /></div>
        <div>
          <div class="stat-label">Lifetime spend</div>
          <div class="stat-value">{{ formatMoney(stats.totalSpent, cur) }}</div>
          <div class="stat-hint">Across all sales</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber"><Wallet :size="22" /></div>
        <div>
          <div class="stat-label">Balance due</div>
          <div class="stat-value">{{ formatMoney(stats.totalDue, cur) }}</div>
          <div class="stat-hint">Store credit owed</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between">
      <div class="search" style="flex:1;min-width:220px;max-width:420px">
        <Search :size="16" />
        <input placeholder="Search by name, phone or email…" v-model="query" style="width:100%" />
      </div>
      <button class="btn btn-primary" @click="openNew"><Plus :size="16" /> Add customer</button>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th class="num">Orders</th>
              <th class="num">Total spent</th>
              <th class="num">Balance</th>
              <th class="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id" style="cursor:pointer" @click="viewing = c">
              <td>
                <div class="product-cell">
                  <div class="product-thumb" style="background:var(--primary-soft);color:var(--primary);font-weight:800">
                    {{ c.name.slice(0, 1).toUpperCase() }}
                  </div>
                  <div>
                    <div class="name">{{ c.name }}</div>
                    <div class="sku">Customer since {{ formatDate(c.createdAt) }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style="display:flex;flex-direction:column;gap:2px">
                  <span v-if="c.phone" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px"><Phone :size="12" style="color:var(--text-faint)" />{{ c.phone }}</span>
                  <span v-if="c.email" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px"><Mail :size="12" style="color:var(--text-faint)" />{{ c.email }}</span>
                  <span v-if="!c.phone && !c.email" style="color:var(--text-faint);font-size:12.5px">No contact</span>
                </div>
              </td>
              <td class="num">{{ customerSales(c.id).length }}</td>
              <td class="num">{{ formatMoney(spent(c.id), cur) }}</td>
              <td class="num">
                <span v-if="c.balance > 0" class="badge badge-amber">{{ formatMoney(c.balance, cur) }}</span>
                <span v-else style="color:var(--text-faint)">—</span>
              </td>
              <td class="num">
                <div style="display:inline-flex;gap:6px">
                  <button class="btn-icon btn-ghost" @click.stop="openEdit(c)"><Pencil :size="15" /></button>
                  <button class="btn-icon btn-ghost" style="color:var(--danger)" @click.stop="deleting = c"><Trash2 :size="15" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6">
                <div class="empty-state">
                  <div class="es-icon"><Users :size="24" /></div>
                  <p>No customers found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit -->
    <Modal :open="editing" :title="editingId ? 'Edit customer' : 'Add customer'" @close="editing = false">
      <div v-if="error" style="background:var(--danger-soft);color:#b91c1c;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;font-weight:600">{{ error }}</div>
      <div class="form-row">
        <div class="field"><label>Full name <span class="req">*</span></label><input class="input" v-model="form.name" placeholder="e.g. Jane Doe" /></div>
        <div class="field"><label>Phone</label><input class="input" v-model="form.phone" placeholder="+1 555-0000" /></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Email</label><input class="input" v-model="form.email" placeholder="jane@example.com" /></div>
        <div class="field"><label>Opening balance</label><input class="input" type="number" min="0" step="0.01" v-model.number="form.balance" /></div>
      </div>
      <div class="field"><label>Notes</label><textarea class="textarea" v-model="form.notes" placeholder="Preferences, VIP status, etc." /></div>
      <template #footer>
        <button class="btn btn-ghost" @click="editing = false">Cancel</button>
        <button class="btn btn-primary" @click="save">{{ editingId ? 'Save changes' : 'Add customer' }}</button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deleting"
      title="Delete customer"
      :message="`Delete &quot;${deleting?.name ?? ''}&quot;? Their sales history is kept.`"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />

    <!-- Detail -->
    <Modal :open="!!viewing" :title="viewing?.name ?? ''" :wide="true" @close="viewing = null">
      <template v-if="viewing">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:20px">
          <div class="product-thumb" style="width:56px;height:56px;background:var(--primary-soft);color:var(--primary);font-size:24px;font-weight:800">{{ viewing.name.slice(0,1).toUpperCase() }}</div>
          <div>
            <div style="font-weight:700;font-size:17px">{{ viewing.name }}</div>
            <div style="font-size:12.5px;color:var(--text-faint)">{{ viewing.phone || 'No phone' }} · {{ viewing.email || 'No email' }}</div>
            <div v-if="viewing.notes" style="font-size:12.5px;color:var(--text-soft);margin-top:2px">📝 {{ viewing.notes }}</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:12px;color:var(--text-faint);font-weight:600">LIFETIME SPEND</div>
            <div style="font-size:20px;font-weight:800">{{ formatMoney(spent(viewing.id), cur) }}</div>
            <span v-if="viewing.balance > 0" class="badge badge-amber">Balance due {{ formatMoney(viewing.balance, cur) }}</span>
          </div>
        </div>

        <div class="section-head" style="margin-bottom:10px">
          <div>
            <h2 style="font-size:15px">Purchase history</h2>
            <div class="sub">{{ viewingSales.length }} orders · tap a row to see checkout details</div>
          </div>
        </div>

        <div v-if="viewingSales.length === 0" class="empty-state">
          <div class="es-icon"><Wallet :size="24" /></div>
          <p>No purchases yet — charge to this customer at checkout</p>
        </div>
        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:40px"></th>
                <th>Receipt</th>
                <th>Date</th>
                <th>Payment</th>
                <th class="num">Total</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="s in viewingSales" :key="s.id">
                <tr style="cursor:pointer" @click="expanded = expanded === s.id ? null : s.id">
                  <td>
                    <button class="btn-icon btn-ghost" @click.stop="expanded = expanded === s.id ? null : s.id" aria-label="Toggle details">
                      <ChevronDown v-if="expanded === s.id" :size="15" />
                      <ChevronRight v-else :size="15" />
                    </button>
                  </td>
                  <td><b>#{{ s.receiptNo }}</b></td>
                  <td>{{ formatDate(s.createdAt) }}</td>
                  <td><span class="badge badge-gray">{{ paymentSummary(s) }}</span></td>
                  <td class="num" style="font-weight:700">{{ formatMoney(s.total, cur) }}</td>
                </tr>
                <tr v-if="expanded === s.id" class="detail-row">
                  <td colspan="5">
                    <div class="sale-detail">
                      <div class="sale-detail-grid">
                        <div>
                          <div class="detail-label">Items</div>
                          <table class="table table-sm">
                            <thead>
                              <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr>
                            </thead>
                            <tbody>
                              <tr v-for="(it, i) in s.items" :key="i">
                                <td>{{ it.name }}</td>
                                <td class="num">×{{ it.qty }}</td>
                                <td class="num">{{ formatMoney(it.price, cur) }}</td>
                                <td class="num">{{ formatMoney(it.price * it.qty, cur) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div class="sale-summary">
                          <div class="detail-label">Summary</div>
                          <div class="sum-row"><span>Subtotal</span><span>{{ formatMoney(s.subtotal, cur) }}</span></div>
                          <div v-if="s.discount > 0" class="sum-row"><span>Discount</span><span style="color:var(--danger)">−{{ formatMoney(s.discount, cur) }}</span></div>
                          <div class="sum-row"><span>Tax ({{ taxRatePercent(s.taxRate) }}%)</span><span>{{ formatMoney(s.taxAmount, cur) }}</span></div>
                          <div class="sum-row total"><span>Total</span><span>{{ formatMoney(s.total, cur) }}</span></div>
                          <div class="detail-label" style="margin-top:14px">Payment</div>
                          <div class="sum-row"><span>Method</span><span>{{ paymentSummary(s) }}</span></div>
                          <template v-if="s.payments && s.payments.length > 1">
                            <div v-for="p in s.payments" :key="p.method" class="sum-row"><span>&nbsp;&nbsp;{{ paymentLabel(p.method) }}</span><span>{{ formatMoney(p.amount, cur) }}</span></div>
                          </template>
                          <div v-if="s.cashReceived != null" class="sum-row"><span>Cash received</span><span>{{ formatMoney(s.cashReceived, cur) }}</span></div>
                          <div v-if="s.changeDue != null" class="sum-row"><span>Change</span><span>{{ formatMoney(s.changeDue, cur) }}</span></div>
                          <div class="sum-row"><span>Receipt</span><span>#{{ s.receiptNo }}</span></div>
                          <div class="sum-row"><span>Date</span><span>{{ formatDateTime(s.createdAt) }}</span></div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Wallet, Users, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useStore } from '../store/useStore'
import { formatMoney, formatDate, formatDateTime, paymentLabel, paymentSummary, taxRatePercent } from '../utils/format'
import type { Customer } from '../types'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useStore()
const cur = computed(() => store.settings.currency)

const query = ref('')
const editing = ref(false)
const editingId = ref<string | null>(null)
const deleting = ref<Customer | null>(null)
const viewing = ref<Customer | null>(null)
const expanded = ref<string | null>(null)
const error = ref('')

const form = reactive({ name: '', phone: '', email: '', balance: 0, notes: '' })

const stats = computed(() => {
  const totalDue = store.customers.reduce((s, c) => s + c.balance, 0)
  const totalSpent = store.sales.reduce((s, x) => s + x.total, 0)
  return { totalDue, totalSpent }
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return store.customers.filter((c) =>
    !q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  )
})

function customerSales(id: string) { return store.sales.filter((s) => s.customerId === id) }
function spent(id: string) { return customerSales(id).reduce((s, x) => s + x.total, 0) }

const viewingSales = computed(() => {
  if (!viewing.value) return []
  return store.sales.filter((s) => s.customerId === viewing.value!.id).sort((a, b) => b.createdAt - a.createdAt)
})

function openNew() {
  editingId.value = null
  form.name = ''; form.phone = ''; form.email = ''; form.balance = 0; form.notes = ''
  error.value = ''
  editing.value = true
}
function openEdit(c: Customer) {
  editingId.value = c.id
  form.name = c.name; form.phone = c.phone; form.email = c.email; form.balance = c.balance; form.notes = c.notes
  error.value = ''
  editing.value = true
}
function save() {
  error.value = ''
  if (!form.name.trim()) { error.value = 'Name is required'; return }
  if (form.balance < 0) { error.value = 'Balance cannot be negative'; return }
  const payload = { name: form.name, phone: form.phone, email: form.email, balance: form.balance, notes: form.notes }
  if (editingId.value) {
    store.updateCustomer(editingId.value, payload)
    store.pushToast('success', `${form.name} updated`)
  } else {
    store.addCustomer(payload)
    store.pushToast('success', `${form.name} added`)
  }
  editing.value = false
}
function confirmDelete() {
  if (deleting.value) {
    store.deleteCustomer(deleting.value.id)
    store.pushToast('success', `${deleting.value.name} deleted`)
    deleting.value = null
  }
}
</script>
