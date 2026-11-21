import { reactive } from 'vue'
import {
  loadBrowserModel,
  browserChat,
  isWebGpuSupported,
  normalizeModelId
} from '../utils/browserLlm'
import type { AiMessage } from '../utils/ai'

export type BrowserAiStatus = 'unsupported' | 'idle' | 'loading' | 'ready' | 'error'

interface BrowserAiState {
  status: BrowserAiStatus
  progress: number
  message: string
  error: string
  modelId: string | null
  /** Model ids that have been loaded at least once — their weights are cached in the browser, so re-loads are fast. */
  downloadedModels: string[]
  startLoad: (modelId: string) => Promise<void>
  chat: (modelId: string, messages: AiMessage[], opts?: { signal?: AbortSignal; onProgress?: (text: string) => void }) => Promise<string>
  reset: () => void
}

const STORAGE_KEY = 'mepos-browser-ai'

function readDownloadedModels(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const data = parsed?.state ?? parsed
    const list = data?.downloadedModels
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeDownloadedModels(downloadedModels: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { downloadedModels } }))
  } catch {}
}

/** True when the given model has been loaded before, so we can say "load from cache" instead of "download". */
export function isModelCached(modelId: string, downloadedModels: string[]): boolean {
  const n = normalizeModelId(modelId)
  return downloadedModels.includes(n)
}

function createState(): BrowserAiState {
  const state = reactive<BrowserAiState>({
    status: isWebGpuSupported() ? 'idle' : 'unsupported',
    progress: 0,
    message: '',
    error: '',
    modelId: null,
    downloadedModels: readDownloadedModels(),

    async startLoad(modelId: string) {
      if (state.status === 'ready' && state.modelId === modelId) return
      if (state.status === 'loading') return

      const cached = isModelCached(modelId, state.downloadedModels)
      state.status = 'loading'
      state.progress = 0
      state.message = cached ? 'Loading model from cache…' : 'Downloading model… (first time, keep this tab open)'
      state.error = ''
      state.modelId = modelId

      try {
        await loadBrowserModel(modelId, (p, text) => {
          const t = text || ''
          const pct = Math.max(0, Math.min(100, Math.round(p * 100)))
          state.progress = pct
          state.message = t.length > 100 ? `${t.slice(0, 100)}…` : t
        })
        state.status = 'ready'
        state.progress = 100
        state.message = 'Model ready'
        state.error = ''
        const n = normalizeModelId(modelId)
        if (!state.downloadedModels.includes(n)) {
          state.downloadedModels = [...state.downloadedModels, n]
          writeDownloadedModels(state.downloadedModels)
        }
      } catch (err) {
        state.status = 'error'
        state.progress = 0
        state.message = ''
        state.error = (err as Error).message
      }
    },

    async chat(modelId: string, messages: AiMessage[], opts?: { signal?: AbortSignal; onProgress?: (text: string) => void }) {
      return browserChat(modelId, messages, opts)
    },

    reset() {
      state.status = isWebGpuSupported() ? 'idle' : 'unsupported'
      state.progress = 0
      state.message = ''
      state.error = ''
      state.modelId = null
    }
  })
  return state
}

const singleton = createState()
export function useBrowserAi() {
  return singleton
}

