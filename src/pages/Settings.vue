<template>
  <div class="page">
    <div class="section-head">
      <div>
        <h2>Settings</h2>
        <div class="sub">Store, receipts, AI and backups</div>
      </div>
      <button class="btn btn-primary" @click="save"><Save :size="16" /> Save settings</button>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><h3>Store</h3></div>
      <div class="card-body">
        <div class="form-row">
          <div class="field"><label>Store name</label><input class="input" v-model="form.storeName" /></div>
          <div class="field"><label>Tagline</label><input class="input" v-model="form.tagline" /></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Currency symbol</label><input class="input" v-model="form.currency" style="max-width:120px" /></div>
          <div class="field"><label>Tax rate (%)</label><input class="input" type="number" min="0" step="0.01" v-model.number="form.taxRate" style="max-width:160px" /></div>
        </div>
        <div class="field"><label>Receipt footer</label><textarea class="textarea" v-model="form.receiptFooter" /></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><h3>AI assistant</h3></div>
      <div class="card-body">
        <label style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <input type="checkbox" v-model="form.aiEnabled" /> Enable SmartMate assistant
        </label>
        <div class="field" style="max-width:420px;margin-bottom:12px">
          <label>Browser model</label>
          <select class="select" v-model="form.browserModel">
            <option v-for="m in models" :key="m.id" :value="m.id">{{ m.label }} ({{ m.size }}){{ isCached(m.id) ? ' · cached' : '' }}</option>
          </select>
        </div>
        <div class="field" style="max-width:420px">
          <label>SmartMate data source</label>
          <select class="select" v-model="form.aiDataSource">
            <option value="snapshot">App snapshot (default)</option>
            <option value="neon">Neon DB (AI answers only)</option>
          </select>
          <div style="font-size:12.5px;color:var(--text-faint);margin-top:6px">Neon mode fetches fresh data from Neon for each SmartMate question. POS screens still use the synced app snapshot.</div>
        </div>
        <div v-if="!webgpu" style="margin-top:10px;color:var(--danger);font-size:13px">WebGPU is not supported in this browser. Local model loading may not work.</div>
        <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-soft" @click="loadModel" :disabled="ai.status === 'loading'">
            <Cpu :size="15" /> {{ ai.status === 'loading' ? 'Loading…' : (isCached(form.browserModel) ? 'Load from cache' : 'Download & load') }}
          </button>
          <button class="btn btn-ghost" @click="ai.reset()">Reset</button>
          <span style="font-size:13px;color:var(--text-soft)">Status: {{ ai.status }} <template v-if="ai.status==='loading'">({{ ai.progress }}%)</template></span>
        </div>
        <div v-if="ai.error" style="margin-top:8px;color:var(--danger);font-size:13px">{{ ai.error }}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><h3>Backup & restore</h3></div>
      <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-soft" @click="doBackup"><Download :size="15" /> Download backup</button>
        <label class="btn btn-ghost" style="cursor:pointer">
          <Upload :size="15" /> Restore from file
          <input type="file" accept="application/json,.json" style="display:none" @change="onRestore" />
        </label>
        <span style="font-size:12.5px;color:var(--text-faint)">Backup contains store data snapshot. Restore replaces current local store state (server sync will push if enabled).</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3>Knowledge base</h3>
          <div class="sub">Docs used by the assistant</div>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNewKnowledge">
          <Plus :size="14" /> Add document
        </button>
      </div>
      <div class="card-body">
        <div v-if="(store.knowledge || []).length === 0" style="color:var(--text-faint);font-size:13px">No knowledge documents loaded.</div>
        <div v-else class="simple-list" style="border:1px solid var(--border);border-radius:12px">
          <div v-for="k in store.knowledge" :key="k.id" class="sl-row">
            <div class="sl-info">
              <div class="sl-name">{{ k.title }}</div>
              <div class="sl-sub">{{ (k.content || '').slice(0, 100) }}{{ (k.content||'').length>100?'…':'' }}</div>
            </div>
            <div style="display:inline-flex;gap:6px;flex-shrink:0">
              <button class="btn-icon btn-ghost" title="Edit" @click="openEditKnowledge(k)"><Pencil :size="15" /></button>
              <button class="btn-icon btn-ghost" style="color:var(--danger)" title="Delete" @click="deletingKnowledge = k"><Trash2 :size="15" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal :open="knowledgeOpen" :title="editingKnowledgeId ? 'Edit knowledge document' : 'Add knowledge document'" :wide="true" @close="knowledgeOpen = false">
      <div v-if="knowledgeError" style="background:var(--danger-soft);color:#b91c1c;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-size:13px;font-weight:600">{{ knowledgeError }}</div>
      <div class="field">
        <label>Title <span class="req">*</span></label>
        <input class="input" v-model="knowledgeForm.title" placeholder="e.g. Return policy" />
      </div>
      <div class="field">
        <label>Content <span class="req">*</span></label>
        <textarea class="textarea" v-model="knowledgeForm.content" rows="10" placeholder="Information the assistant can use to answer questions" style="min-height:220px"></textarea>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="knowledgeOpen = false">Cancel</button>
        <button class="btn btn-primary" @click="saveKnowledge">{{ editingKnowledgeId ? 'Save changes' : 'Add document' }}</button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!deletingKnowledge"
      title="Delete knowledge document"
      :message="`Delete &quot;${deletingKnowledge?.title ?? ''}&quot;? This cannot be undone.`"
      @cancel="deletingKnowledge = null"
      @confirm="confirmDeleteKnowledge"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Save, Download, Upload, Cpu, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { useStore, DEFAULT_SETTINGS } from '../store/useStore'
import { useBrowserAi, isModelCached } from '../store/browserAi'
import { BROWSER_MODELS, isWebGpuSupported, normalizeModelId } from '../utils/browserLlm'
import { downloadBackup, restoreFromFile } from '../utils/backup'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import type { KnowledgeDoc } from '../types'

const store = useStore()
const ai = useBrowserAi()
const models = BROWSER_MODELS
const webgpu = isWebGpuSupported()

const knowledgeOpen = ref(false)
const editingKnowledgeId = ref<string | null>(null)
const deletingKnowledge = ref<KnowledgeDoc | null>(null)
const knowledgeError = ref('')
const knowledgeForm = reactive({ title: '', content: '' })

function openNewKnowledge() {
  editingKnowledgeId.value = null
  knowledgeForm.title = ''
  knowledgeForm.content = ''
  knowledgeError.value = ''
  knowledgeOpen.value = true
}

function openEditKnowledge(doc: KnowledgeDoc) {
  editingKnowledgeId.value = doc.id
  knowledgeForm.title = doc.title
  knowledgeForm.content = doc.content
  knowledgeError.value = ''
  knowledgeOpen.value = true
}

function saveKnowledge() {
  knowledgeError.value = ''
  const title = knowledgeForm.title.trim()
  const content = knowledgeForm.content.trim()
  if (!title) { knowledgeError.value = 'Title is required'; return }
  if (!content) { knowledgeError.value = 'Content is required'; return }
  if (editingKnowledgeId.value) {
    store.updateKnowledgeDoc(editingKnowledgeId.value, { title, content })
    store.pushToast('success', 'Knowledge document updated')
  } else {
    store.addKnowledgeDoc(title, content)
    store.pushToast('success', 'Knowledge document added')
  }
  knowledgeOpen.value = false
}

function confirmDeleteKnowledge() {
  if (!deletingKnowledge.value) return
  store.deleteKnowledgeDoc(deletingKnowledge.value.id)
  store.pushToast('success', 'Knowledge document deleted')
  deletingKnowledge.value = null
}

const form = reactive({
  storeName: store.settings.storeName,
  tagline: store.settings.tagline,
  currency: store.settings.currency,
  taxRate: store.settings.taxRate,
  receiptFooter: store.settings.receiptFooter,
  aiEnabled: store.settings.aiEnabled,
  browserModel: store.settings.browserModel || DEFAULT_SETTINGS.browserModel,
  aiDataSource: store.settings.aiDataSource || 'snapshot',
})

function save() {
  store.updateSettings({
    storeName: form.storeName,
    tagline: form.tagline,
    currency: form.currency,
    taxRate: Number(form.taxRate) || 0,
    receiptFooter: form.receiptFooter,
    aiEnabled: !!form.aiEnabled,
    browserModel: normalizeModelId(form.browserModel) || DEFAULT_SETTINGS.browserModel,
    aiDataSource: form.aiDataSource === 'neon' ? 'neon' : 'snapshot',
  })
  store.pushToast('success', 'Settings saved')
}

function isCached(id: string) { return isModelCached(id, ai.downloadedModels || []) }
function loadModel() { ai.startLoad(form.browserModel) }
function doBackup() { downloadBackup(); store.pushToast('success', 'Backup downloaded') }
async function onRestore(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await restoreFromFile(file)
    store.pushToast('success', 'Backup restored')
  } catch (err) {
    store.pushToast('error', (err as Error).message || 'Restore failed')
  } finally {
    input.value = ''
  }
}
</script>
