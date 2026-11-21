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
        <div class="field" style="max-width:420px">
          <label>Browser model</label>
          <select class="select" v-model="form.browserModel">
            <option v-for="m in models" :key="m.id" :value="m.id">{{ m.label }} ({{ m.size }}){{ isCached(m.id) ? ' · cached' : '' }}</option>
          </select>
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
      <div class="card-header"><h3>Knowledge base</h3><span class="sub">Docs used by the assistant</span></div>
      <div class="card-body">
        <div v-if="(store.knowledge || []).length === 0" style="color:var(--text-faint);font-size:13px">No knowledge documents loaded.</div>
        <div v-else class="simple-list">
          <div v-for="k in store.knowledge" :key="k.id" class="sl-row">
            <div class="sl-info">
              <div class="sl-name">{{ k.title }}</div>
              <div class="sl-sub">{{ (k.content || '').slice(0, 80) }}{{ (k.content||'').length>80?'…':'' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Save, Download, Upload, Cpu } from 'lucide-vue-next'
import { useStore, DEFAULT_SETTINGS } from '../store/useStore'
import { useBrowserAi, isModelCached } from '../store/browserAi'
import { BROWSER_MODELS, isWebGpuSupported, normalizeModelId } from '../utils/browserLlm'
import { downloadBackup, restoreFromFile } from '../utils/backup'

const store = useStore()
const ai = useBrowserAi()
const models = BROWSER_MODELS
const webgpu = isWebGpuSupported()

const form = reactive({
  storeName: store.settings.storeName,
  tagline: store.settings.tagline,
  currency: store.settings.currency,
  taxRate: store.settings.taxRate,
  receiptFooter: store.settings.receiptFooter,
  aiEnabled: store.settings.aiEnabled,
  browserModel: store.settings.browserModel || DEFAULT_SETTINGS.browserModel,
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
