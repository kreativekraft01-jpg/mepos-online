<template>
  <div class="page">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green"><Landmark :size="22" /></div>
        <div>
          <div class="stat-label">Tills</div>
          <div class="stat-value">{{ store.tills.length }}</div>
          <div class="stat-hint">{{ openTills.length }} with banking open</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber"><Timer :size="22" /></div>
        <div>
          <div class="stat-label">Counter cash (open tills)</div>
          <div class="stat-value">{{ formatMoney(stats.expectedTotal, cur) }}</div>
          <div class="stat-hint">Expected in drawers right now</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon indigo"><Unlock :size="22" /></div>
        <div>
          <div class="stat-label">Cash sales today</div>
          <div class="stat-value">{{ formatMoney(stats.cashToday, cur) }}</div>
          <div class="stat-hint">Recorded across all tills</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap">
      <div style="font-size:13.5px;color:var(--text-soft)">
        Staff must open banking on a till before accepting payments, and close it (with a cash tally) at end of day.
      </div>
      <button class="btn btn-primary" @click="adding = true"><Plus :size="16" /> Add till</button>
    </div>

    <div class="till-grid">
      <div v-for="t in store.tills" :key="t.id" :class="['card', 'till-card', { open: t.status === 'open' }]">
        <div class="till-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div :class="['till-icon', t.status === 'open' ? 'green' : 'gray']">
              <Unlock v-if="t.status === 'open'" :size="18" />
              <Lock v-else :size="18" />
            </div>
            <div>
              <div class="till-name">
                {{ t.name }}
                <span v-if="activeTillId === t.id" class="badge badge-indigo">In use at POS</span>
              </div>
              <div class="till-sub">
                <template v-if="t.status === 'open'">
                  Banking open · {{ t.openedBy ?? '—' }} · {{ formatDateTime(t.openedAt ?? Date.now()) }}
                </template>
                <template v-else-if="t.closedAt">
                  Closed {{ formatDateTime(t.closedAt) }}<template v-if="t.closedBy"> by {{ t.closedBy }}</template>
                </template>
                <template v-else>Banking closed</template>
              </div>
            </div>
          </div>
          <span :class="['badge', t.status === 'open' ? 'badge-green' : 'badge-gray']">{{ t.status === 'open' ? 'Open' : 'Closed' }}</span>
        </div>

        <div class="till-stats">
          <div><span class="ts-label">Opening float</span><span class="ts-value">{{ formatMoney(t.openingFloat, cur) }}</span></div>
          <div><span class="ts-label">Counter cash</span><span class="ts-value">{{ formatMoney(t.status === 'open' ? tillExpectedCash(t, store.sales) : (t.expectedCash ?? 0), cur) }}</span></div>
          <div v-if="t.countedCash !== undefined"><span class="ts-label">Counted</span><span class="ts-value">{{ formatMoney(t.countedCash, cur) }}</span></div>
          <div v-if="t.variance !== undefined">
            <span class="ts-label">Variance</span>
            <span :class="['ts-value', t.variance === 0 ? '' : (t.variance < 0 ? 'neg' : 'pos')]">
              {{ t.variance === 0 ? '✓ Tallied' : `${t.variance < 0 ? 'Short' : 'Over'} ${formatMoney(Math.abs(t.variance), cur)}` }}
            </span>
          </div>
        </div>

        <div v-if="(t.variance ?? 0) !== 0 && t.shortageReason" :class="['till-note', (t.variance ?? 0) < 0 ? 'neg' : 'pos']">
          <AlertTriangle v-if="(t.variance ?? 0) < 0" :size="14" />
          <CheckCircle2 v-else :size="14" />
          <span>
            <b>{{ (t.variance ?? 0) < 0 ? 'Manager override' : 'Overage' }}</b> — {{ t.shortageReason }}
            <template v-if="t.managerTag"> · tagged by {{ t.managerTag }}</template>
          </span>
        </div>

        <div class="till-actions">
          <template v-if="t.status === 'open'">
            <button v-if="activeTillId !== t.id" class="btn btn-ghost btn-sm" @click="store.setActiveTill(t.id)"><User :size="14" /> Use this till</button>
            <button class="btn btn-primary btn-sm" @click="closing = t"><Lock :size="14" /> Close banking</button>
          </template>
          <template v-else>
            <button class="btn btn-success btn-sm" @click="opening = t"><Unlock :size="14" /> Open banking</button>
            <button class="btn-icon btn-ghost" @click="deleting = t" title="Delete till"><Trash2 :size="15" /></button>
          </template>
        </div>
      </div>
      <div v-if="store.tills.length === 0" class="empty-state" style="grid-column:1 / -1">
        <div class="es-icon"><Landmark :size="24" /></div>
        <p>No tills yet — add one to start banking.</p>
      </div>
    </div>

    <!-- Open modal -->
    <Modal :open="!!opening" :title="opening ? `Open banking — ${opening.name}` : ''" @close="opening = null">
      <div v-if="openError" style="background:var(--danger-soft);color:#b91c1c;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;font-weight:600">{{ openError }}</div>
      <p style="font-size:13px;color:var(--text-soft);margin-top:0">
        Checkout is blocked on every till until banking is opened. Sales made on this till will count toward its counter cash at close.
      </p>
      <div class="form-row">
        <div class="field"><label>Opened by <span class="req">*</span></label><input class="input" placeholder="Staff name" v-model="openBy" /></div>
        <div class="field"><label>Opening float ({{ cur }})</label><input class="input" type="number" min="0" step="0.01" v-model.number="openFloat" placeholder="0.00" /></div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="opening = null">Cancel</button>
        <button class="btn btn-success" @click="confirmOpen"><Unlock :size="15" /> Open banking</button>
      </template>
    </Modal>

    <!-- Close modal -->
    <Modal :open="!!closing" :title="closing ? `Close banking — ${closing.name}` : ''" @close="closing = null">
      <div v-if="closeError" style="background:var(--danger-soft);color:#b91c1c;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;font-weight:600">{{ closeError }}</div>
      <div v-if="closing" class="till-tally">
        <div><span>Counter cash expected</span><b>{{ formatMoney(expectedForClosing, cur) }}</b></div>
        <div>
          <span>Your counted cash</span>
          <input class="input" type="number" min="0" step="0.01" v-model.number="countedCash" placeholder="0.00" />
        </div>
        <div :class="closeVarianceClass">
          <span>Variance</span>
          <b>{{ closeVarianceLabel }}</b>
        </div>
      </div>
      <div class="field"><label>Closed by <span class="req">*</span></label><input class="input" placeholder="Staff name" v-model="closedBy" /></div>
      <div v-if="needsOverride" style="background:var(--danger-soft);color:#b91c1c;border:1px solid var(--danger-soft);border-radius:12px;padding:14px;margin-top:4px">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:10px"><AlertTriangle :size="16" /> Cash doesn't tally — manager approval required</div>
        <div class="field">
          <label>Manager tag <span class="req">*</span></label>
          <div class="input-group"><span class="prefix"><Hash :size="13" /></span><input class="input" placeholder="Manager name / ID" v-model="managerTag" /></div>
        </div>
        <div class="field">
          <label>Reason <span class="req">*</span></label>
          <textarea class="textarea" style="min-height:70px" placeholder="e.g. gave wrong change to a customer, counted drawer twice…" v-model="reason"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="closing = null">Cancel</button>
        <button class="btn btn-primary" @click="confirmClose"><Lock :size="15" /> Close banking</button>
      </template>
    </Modal>

    <!-- Add -->
    <Modal :open="adding" title="Add a till" @close="adding = false">
      <div v-if="addError" style="background:var(--danger-soft);color:#b91c1c;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;font-weight:600">{{ addError }}</div>
      <div class="field"><label>Till name <span class="req">*</span></label><input class="input" placeholder="e.g. Till 1 · Front" v-model="newTillName" /></div>
      <template #footer>
        <button class="btn btn-ghost" @click="adding = false">Cancel</button>
        <button class="btn btn-primary" @click="confirmAdd"><Plus :size="15" /> Add till</button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deleting"
      title="Delete till?"
      :message="`Delete &quot;${deleting?.name ?? ''}&quot;? This does not affect recorded sales, but the till can no longer be used for banking.`"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Landmark, Plus, Lock, Unlock, Trash2, CheckCircle2, AlertTriangle, User, Timer, Hash } from 'lucide-vue-next'
import { useStore } from '../store/useStore'
import { formatMoney, formatDateTime, tillExpectedCash } from '../utils/format'
import type { Till } from '../types'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useStore()
const cur = computed(() => store.settings.currency)
const activeTillId = computed(() => store.activeTillId)

const opening = ref<Till | null>(null)
const closing = ref<Till | null>(null)
const adding = ref(false)
const deleting = ref<Till | null>(null)

const openTills = computed(() => store.tills.filter((t) => t.status === 'open'))
const stats = computed(() => {
  const expectedTotal = openTills.value.reduce((s, t) => s + tillExpectedCash(t, store.sales), 0)
  const cashToday = store.sales.filter((s) => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0)
  return { expectedTotal, cashToday }
})

// open
const openBy = ref('')
const openFloat = ref(0)
const openError = ref('')
watch(opening, (v) => { if (v) { openBy.value = ''; openFloat.value = 0; openError.value = '' } })
function confirmOpen() {
  openError.value = ''
  if (!opening.value) return
  if (!openBy.value.trim()) { openError.value = 'Enter the staff member opening banking'; return }
  if (openFloat.value < 0) { openError.value = "Opening float can't be negative"; return }
  store.openTill(opening.value.id, openBy.value.trim(), openFloat.value)
  store.pushToast('success', `Banking opened on ${opening.value.name}`)
  opening.value = null
}

// close
const countedCash = ref<number | undefined>(undefined)
const closedBy = ref('')
const managerTag = ref('')
const reason = ref('')
const closeError = ref('')
watch(closing, (v) => { if (v) { countedCash.value = undefined; closedBy.value = ''; managerTag.value = ''; reason.value = ''; closeError.value = '' } })
const expectedForClosing = computed(() => closing.value ? tillExpectedCash(closing.value, store.sales) : 0)
const closeVariance = computed(() => Math.round(((countedCash.value ?? 0) - expectedForClosing.value) * 100) / 100)
const needsOverride = computed(() => countedCash.value !== undefined && closeVariance.value !== 0)
const closeVarianceLabel = computed(() => {
  if (countedCash.value === undefined) return '—'
  const v = closeVariance.value
  if (v === 0) return '✓ Tallied'
  return `${v < 0 ? 'Short' : 'Over'} ${formatMoney(Math.abs(v), cur.value)}`
})
const closeVarianceClass = computed(() => {
  if (countedCash.value === undefined) return ''
  const v = closeVariance.value
  if (v === 0) return 'ok'
  return v < 0 ? 'neg' : 'pos'
})
function confirmClose() {
  closeError.value = ''
  if (!closing.value) return
  if (countedCash.value === undefined) { closeError.value = 'Count the cash in the drawer first'; return }
  if (!closedBy.value.trim()) { closeError.value = 'Enter the staff member closing banking'; return }
  if (needsOverride.value && (!managerTag.value.trim() || !reason.value.trim())) {
    closeError.value = "Cash doesn't tally — enter the manager tag AND a reason to override"; return
  }
  const res = store.closeTill(closing.value.id, {
    countedCash: countedCash.value,
    closedBy: closedBy.value.trim(),
    managerTag: needsOverride.value ? managerTag.value.trim() : undefined,
    shortageReason: needsOverride.value ? reason.value.trim() : undefined
  })
  if (!res.ok) { closeError.value = res.error || 'Could not close till'; return }
  store.pushToast('success', `Banking closed on ${closing.value.name}`)
  closing.value = null
}

// add
const newTillName = ref('')
const addError = ref('')
watch(adding, (v) => { if (v) { newTillName.value = ''; addError.value = '' } })
function confirmAdd() {
  addError.value = ''
  if (!newTillName.value.trim()) { addError.value = 'Give the till a name'; return }
  store.addTill(newTillName.value.trim())
  store.pushToast('success', `Till "${newTillName.value.trim()}" added`)
  adding.value = false
}

function confirmDelete() {
  if (deleting.value) {
    store.deleteTill(deleting.value.id)
    store.pushToast('success', 'Till deleted')
    deleting.value = null
  }
}
</script>
