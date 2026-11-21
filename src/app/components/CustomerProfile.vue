<template>
  <div class="flex flex-col h-full bg-background animate-in fade-in slide-in-from-right-4 duration-300">
    <!-- Tabs/Header -->
    <div class="flex items-center gap-1 p-2 bg-card border-b border-border overflow-x-auto">
      <button @click="goBack" class="p-3 mr-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Back (Esc)">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['flex items-center gap-2 px-4 py-3 min-w-max transition-all relative group', activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground']"
      >
        <component :is="tab.icon" :class="['w-4 h-4', activeTab === tab.id ? 'text-primary' : 'group-hover:text-foreground']" />
        <span class="text-xs font-bold uppercase tracking-widest">{{ tab.label }}</span>
        <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
      </button>
      <div class="ml-auto flex items-center gap-2 px-4">
        <button
          v-if="customer"
          @click="attach"
          class="px-4 py-2 bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2"
        >
          <User class="w-4 h-4" /> Attach to Transaction
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Not found -->
        <div v-if="!customer || !full" class="flex flex-col items-center justify-center h-64 text-muted-foreground border border-border bg-card">
          <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock class="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 class="text-sm font-bold uppercase tracking-wider">Customer Not Found</h3>
          <p class="text-xs mt-2">The customer profile you are trying to access does not exist.</p>
        </div>

        <!-- Summary -->
        <div v-else-if="activeTab === 'summary'" class="flex flex-col gap-6">
          <!-- Member details -->
          <div class="bg-card border border-border p-4 md:p-5 relative overflow-hidden group">
            <div class="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div class="flex items-center justify-between mb-4 pl-3">
              <h3 class="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                Member Details
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">Active</span>
              </h3>
              <div class="flex gap-2">
                <button class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors" title="Print Label" @click="noopAction('Print label')"><Printer class="w-5 h-5" /></button>
                <button class="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors" title="History" @click="scrollToHistory"><History class="w-5 h-5" /></button>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pl-3">
              <div v-for="f in visibleFields" :key="f.id" :class="f.className || ''">
                <div class="flex items-center h-6">
                  <label class="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{{ f.label }}</label>
                  <button @click="f.visible = !f.visible" class="w-10 h-10 flex items-center justify-center -mr-2 text-muted-foreground hover:text-foreground transition-all" :aria-label="f.visible ? 'Hide details' : 'Show details'">
                    <EyeOff v-if="f.visible" class="w-5 h-5" />
                    <Eye v-else class="w-5 h-5" />
                  </button>
                </div>
                <div :class="['text-sm text-foreground truncate min-h-[20px]', f.mono ? 'font-mono' : '']">
                  {{ f.visible ? f.value() : '••••••••••••••••' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Abilities / quick info -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-card border border-border p-5">
              <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Account Summary</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="bg-muted/40 border border-border p-3">
                  <div class="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Balance</div>
                  <div class="text-lg font-bold mt-1">{{ currency }}{{ (full.balance || 0).toFixed(2) }}</div>
                </div>
                <div class="bg-muted/40 border border-border p-3">
                  <div class="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Loyalty</div>
                  <div class="text-lg font-bold mt-1">{{ customer.loyaltyPoints }} pts</div>
                </div>
                <div class="bg-muted/40 border border-border p-3">
                  <div class="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Member Since</div>
                  <div class="text-sm font-semibold mt-2">{{ memberSince }}</div>
                </div>
                <div class="bg-muted/40 border border-border p-3">
                  <div class="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Orders</div>
                  <div class="text-lg font-bold mt-1">{{ sales.length }}</div>
                </div>
              </div>
            </div>
            <div class="bg-card border border-border p-5">
              <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h3>
              <div class="space-y-2">
                <button @click="attach" class="w-full px-4 py-2.5 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs hover:brightness-110 flex items-center justify-center gap-2"><User class="w-4 h-4" /> Attach to Transaction</button>
                <button @click="activeTab = 'general'" class="w-full px-4 py-2.5 border border-border hover:bg-muted font-semibold text-xs uppercase tracking-wider">Edit Details</button>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="bg-card border border-border flex flex-col">
            <div class="p-3 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
              <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <MessageSquare class="w-3.5 h-3.5" /> Notes History
              </h3>
              <div class="flex items-center gap-3">
                <span class="text-[10px] text-muted-foreground uppercase tracking-wider">{{ notesList.length }} notes</span>
                <button @click="isNoteModalOpen = true" class="px-3 py-1.5 bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center gap-1.5">
                  <Plus class="w-3 h-3" /> Add Note
                </button>
              </div>
            </div>
            <div class="p-4 space-y-3 max-h-72 overflow-y-auto">
              <div v-if="notesList.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare class="w-8 h-8 mb-2 opacity-20" />
                <p class="text-sm">No notes yet</p>
              </div>
              <div v-for="note in notesList" :key="note.id" class="flex flex-col bg-secondary border border-border">
                <div class="flex items-center justify-between bg-muted/40 p-2 border-b border-border">
                  <span class="text-[10px] font-bold text-primary uppercase tracking-wide flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>{{ note.author }}</span>
                  <span class="text-[12px] text-muted-foreground font-mono">{{ note.date }}</span>
                </div>
                <div class="p-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{{ note.content }}</div>
              </div>
            </div>
          </div>

          <!-- Purchase history -->
          <div ref="historySection" class="bg-card border border-border p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm font-bold uppercase tracking-wider">Purchase History</div>
              <div class="text-xs text-muted-foreground">{{ sales.length }} transactions</div>
            </div>
            <div v-if="sales.length === 0" class="text-sm text-muted-foreground">No purchases yet.</div>
            <div v-else class="divide-y divide-border">
              <div v-for="s in sales" :key="s.id" class="py-3 flex items-center justify-between gap-4">
                <div>
                  <div class="font-medium text-sm">Receipt #{{ s.receiptNo }} <span class="text-muted-foreground">· {{ s.kind }}</span></div>
                  <div class="text-xs text-muted-foreground">{{ formatDateTime(s.createdAt) }} · {{ s.items.length }} item(s)</div>
                </div>
                <div class="text-right font-semibold" :class="s.total < 0 ? 'text-[#8B5CF6]' : ''">{{ currency }}{{ Math.abs(s.total).toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- General -->
        <div v-else-if="activeTab === 'general'" class="bg-card border border-border p-6 max-w-4xl mx-auto">
          <h3 class="text-sm font-bold text-foreground uppercase tracking-wider mb-6 flex items-center gap-2"><User class="w-4 h-4 text-primary" /> Personal Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">First Name</label>
              <input v-model="form.firstName" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Surname</label>
              <input v-model="form.lastName" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Display Name</label>
              <input v-model="form.name" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Email Address</label>
              <input v-model="form.email" type="email" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Mobile Number</label>
              <input v-model="form.phone" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none" />
            </div>
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Membership ID</label>
              <input :value="full.id" disabled class="w-full h-10 px-3 bg-input border border-border text-muted-foreground text-sm font-mono disabled:opacity-60" />
            </div>
            <div class="lg:col-span-1">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Status</label>
              <select v-model="form.status" class="w-full h-10 px-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none">
                <option>Active</option><option>Inactive</option><option>Banned</option>
              </select>
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
            <button @click="resetForm" class="px-6 py-2 border border-border hover:bg-muted text-muted-foreground font-bold uppercase tracking-wider text-xs transition-colors">Reset</button>
            <button @click="saveGeneral" class="px-6 py-2 bg-primary hover:brightness-110 text-primary-foreground font-bold uppercase tracking-wider text-xs transition-colors">Update</button>
          </div>
        </div>

        <!-- Address -->
        <div v-else-if="activeTab === 'address'" class="bg-card border border-border p-6 max-w-4xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><MapPin class="w-4 h-4 text-primary" /> Saved Addresses</h3>
          </div>
          <div class="bg-secondary border border-border p-4 flex flex-col md:flex-row gap-4 md:items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-bold text-foreground uppercase tracking-wide bg-muted px-2 py-0.5 rounded">Primary</span>
              </div>
              <div class="text-sm text-muted-foreground leading-relaxed">No address on file for this customer.</div>
              <p class="text-xs text-muted-foreground mt-2">Address fields are not stored in the current customer record.</p>
            </div>
            <div class="shrink-0">
              <button disabled class="px-3 py-1.5 border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 cursor-not-allowed flex items-center gap-2 justify-center"><Shield class="w-3.5 h-3.5" /> Verify</button>
            </div>
          </div>
        </div>

        <!-- Restricted tabs -->
        <div v-else class="flex flex-col items-center justify-center h-64 text-muted-foreground border border-border bg-card">
          <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock class="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 class="text-sm font-bold uppercase tracking-wider">Restricted Area</h3>
          <p class="text-xs mt-2">Manager authorization required to view {{ activeTab }} details.</p>
        </div>
      </div>
    </div>

    <!-- Add Note Modal -->
    <div v-if="isNoteModalOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-card border border-border w-full max-w-lg flex flex-col shadow-2xl">
        <div class="p-4 border-b border-border flex items-center justify-between bg-muted/40">
          <h3 class="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><MessageSquare class="w-4 h-4 text-primary" /> Add New Note</h3>
          <button @click="isNoteModalOpen = false" class="text-muted-foreground hover:text-foreground"><X class="w-5 h-5" /></button>
        </div>
        <div class="p-4">
          <textarea v-model="newNote" placeholder="Type your note here..." class="w-full h-32 p-3 bg-input border border-border text-foreground text-sm focus:border-primary focus:outline-none transition-colors resize-none mb-4"></textarea>
          <div class="flex justify-end gap-3">
            <button @click="isNoteModalOpen = false" class="px-4 py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider transition-colors">Cancel</button>
            <button @click="saveNote" :disabled="!newNote.trim()" class="px-4 py-2 bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold uppercase tracking-wider transition-colors">Save Note</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { User, MapPin, CreditCard, Shield, Activity, MoreHorizontal, Printer, History, Eye, EyeOff, Plus, Lock, MessageSquare, X, ArrowLeft } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useStore } from '@/store/useStore'
import type { CustomerResult } from './SearchResultsTypes'

const props = defineProps<{ customer: CustomerResult | null }>()
const emit = defineEmits<{ back: []; 'attach-to-transaction': [customer: CustomerResult] }>()

const store = useStore()
const currency = computed(() => store.settings.currency || '£')
const activeTab = ref<'summary' | 'general' | 'address' | 'id' | 'payment' | 'other'>('summary')
const isNoteModalOpen = ref(false)
const newNote = ref('')
const historySection = ref<HTMLElement | null>(null)

const tabs = [
  { id: 'summary', label: 'Summary', icon: Activity },
  { id: 'general', label: 'General', icon: User },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'id', label: 'ID & Verification', icon: Shield },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
] as const

const full = computed(() => props.customer ? store.customers.find(c => c.id === props.customer!.id) || null : null)
const sales = computed(() => props.customer ? store.sales.filter(s => s.customerId === props.customer!.id).slice().sort((a,b)=>b.createdAt-a.createdAt) : [])
const memberSince = computed(() => full.value ? new Date(full.value.createdAt).toLocaleDateString() : '—')

function splitName(name: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const form = reactive({ firstName: '', lastName: '', name: '', email: '', phone: '', status: 'Active' })

function resetForm() {
  const c = full.value
  if (!c) return
  const s = splitName(c.name)
  form.firstName = s.firstName
  form.lastName = s.lastName
  form.name = c.name || ''
  form.email = c.email || ''
  form.phone = c.phone || ''
  form.status = 'Active'
}

watch(full, () => resetForm(), { immediate: true })
watch(() => form.firstName + ' ' + form.lastName, () => {
  const composed = `${form.firstName} ${form.lastName}`.trim()
  if (composed) form.name = composed
})

function saveGeneral() {
  if (!full.value) return
  const name = (form.name || `${form.firstName} ${form.lastName}`).trim() || full.value.name
  store.updateCustomer(full.value.id, { name, email: form.email.trim(), phone: form.phone.trim() })
  toast.success('Customer profile updated successfully')
}

function goBack() { emit('back') }
function attach() { if (props.customer) emit('attach-to-transaction', props.customer) }
function noopAction(msg: string) { toast.info(`${msg} — feature not available`) }
function scrollToHistory() { historySection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
function formatDateTime(ts: number) { return new Date(ts).toLocaleString() }

interface NoteEntry { id: string; content: string; author: string; date: string }

const notesList = computed<NoteEntry[]>(() => {
  const raw = full.value?.notes || ''
  if (!raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((n: any, i: number) => ({
        id: String(n?.id ?? i),
        content: String(n?.content ?? n?.text ?? ''),
        author: String(n?.author ?? 'Staff'),
        date: String(n?.date ?? ''),
      })).filter(n => n.content.trim())
    }
  } catch {}
  // legacy/plain text fallback: split blocks or treat as single note
  return [{
    id: 'legacy',
    content: raw,
    author: 'System',
    date: new Date(full.value!.createdAt).toLocaleString(),
  }]
})

function saveNote() {
  if (!full.value || !newNote.value.trim()) return
  const entry: NoteEntry = {
    id: String(Date.now()),
    content: newNote.value.trim(),
    author: 'You',
    date: new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
  }
  const next = [entry, ...notesList.value]
  store.updateCustomer(full.value.id, { notes: JSON.stringify(next) })
  newNote.value = ''
  isNoteModalOpen.value = false
  toast.success('Note added to customer profile')
}

const visibleFields = reactive([
  { id: 'name', label: 'Full Name', visible: true, mono: false, className: '', value: () => full.value?.name || '—' },
  { id: 'email', label: 'Email', visible: false, mono: false, className: '', value: () => full.value?.email || '—' },
  { id: 'phone', label: 'Mobile', visible: false, mono: false, className: '', value: () => full.value?.phone || '—' },
  { id: 'id', label: 'Membership ID', visible: true, mono: true, className: '', value: () => full.value?.id || '—' },
  { id: 'address', label: 'Address', visible: false, mono: false, className: 'md:col-span-2 lg:col-span-4 pt-2 border-t border-border mt-2', value: () => 'No Address' },
])

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  if (isNoteModalOpen.value) {
    if (e.key === 'Escape') { e.preventDefault(); isNoteModalOpen.value = false }
    return
  }
  if (typing) {
    if (e.key === 'Escape') (target as HTMLElement).blur()
    return
  }
  if (e.key === 'Escape') { e.preventDefault(); goBack() }
  else if (e.key.toLowerCase() === 'a' && props.customer) { e.preventDefault(); attach() }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
