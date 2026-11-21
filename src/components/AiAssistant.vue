<template>
  <template v-if="enabled">
    <button class="ai-fab" :aria-expanded="open ? 'true' : 'false'" aria-label="AI assistant" @click="open = !open">
      <span class="agent-x-avatar agent-x-avatar--fab">
        <AgentX :size="32" state="idle" />
      </span>
      <span v-if="!open" class="ai-badge" />
    </button>

    <div v-if="open" :class="['ai-panel', 'ax-modern', { 'ax-expanded': expanded }]" role="dialog" aria-label="Agent X assistant" @keydown.esc.prevent="open = false">
      <div :class="['ai-panel-header', { 'agent-x-thinking': typing }]">
        <div class="agent-x-avatar agent-x-avatar--header">
          <AgentX :size="48" :state="agentState" />
        </div>
        <div style="flex:1;min-width:0">
          <h3>SmartMate <span class="ax-header-tag">ASSISTANT</span></h3>
          <p :title="statusLine.text" style="display:inline-flex;align-items:center;gap:5px;margin:0">
            <span :class="['ax-status-dot', { 'is-active': typing }]" />
            {{ typing ? (phase === 'composing' ? 'Writing a response' : phase === 'checking' ? 'Checking sources' : 'Finding relevant context') : ready ? 'Local AI ready' : ai.status === 'loading' ? 'Loading local AI…' : 'Store knowledge ready' }}
          </p>
        </div>
        <button class="btn-icon ax-expand" :aria-label="expanded ? 'Collapse assistant' : 'Expand assistant'" @click="expanded = !expanded">
          <Minimize2 v-if="expanded" :size="16" />
          <Maximize2 v-else :size="16" />
        </button>
        <button v-if="ai.status === 'error'" class="btn-icon" aria-label="Reload model" title="Reload model" @click="ai.startLoad(modelId)">
          <RefreshCw :size="16" />
        </button>
        <button class="btn-icon" aria-label="Clear chat" title="Clear chat" :disabled="messages.length === 0" @click="clearChat">
          <Trash2 :size="16" />
        </button>
        <button class="btn-icon" aria-label="Close" @click="open = false">
          <X :size="18" />
        </button>
      </div>

      <div v-if="ai.status === 'loading'" class="ai-progress">
        <div class="progress-track"><div class="progress-fill" :style="{ width: `${ai.progress}%` }" /></div>
        <p>{{ ai.message || `Loading model… ${ai.progress}%` }}</p>
      </div>

      <div v-if="ai.status === 'error'" class="ai-model-choice">
        <span>Local AI could not load. Store lookups are still available. Use the reload icon to retry.</span>
      </div>

      <div ref="scrollRef" class="ai-messages" role="log" aria-live="polite">
        <div v-if="messages.length === 0" class="ax-welcome">
          <AgentX :size="72" />
          <span class="ax-eyebrow">A LITTLE HELP. A CLEARER DAY.</span>
          <h2>What can I help<br />you with?</h2>
          <p>Explore your store, understand a policy,<br />or find the right product.</p>
          <div class="ax-capabilities"><span><BookOpen :size="13" /> Your documents</span><span><ShieldCheck :size="13" /> On-device</span></div>
        </div>

        <div v-for="(m, i) in messages" :key="i" :class="['ai-msg', m.role === 'assistant' ? 'assistant' : 'user']" :style="m.role === 'assistant' ? { display: 'flex', gap: '8px', alignItems: 'flex-start' } : undefined">
          <div v-if="m.role === 'assistant'" class="agent-x-msg-dot">
            <AgentX :size="22" state="idle" />
          </div>
          <div style="min-width:0;flex:1">
            <span class="ax-answer-text" style="white-space:pre-wrap">{{ m.content }}</span>
            <div v-for="p in m.products || []" :key="p.id" class="ai-product-card">
              <strong>{{ p.name }}</strong>
              <small>{{ currency }}{{ p.price.toFixed(2) }} · Grade {{ p.grade }} · {{ p.stock }} in stock</small>
              <button :disabled="!canAddToCart(p.id)" @click="addToCart(p.id)">Add to Cart</button>
            </div>
            <details v-for="(source, idx) in m.sources || []" :key="idx" class="ai-source">
              <summary>Source [{{ idx + 1 }}]: {{ source.title }}</summary>
              <p>{{ source.text }}</p>
            </details>
          </div>
        </div>

        <div v-if="typing" class="ax-orb-response" role="status" aria-live="polite">
          <AgentX :size="144" :state="agentState" />
          <span class="ax-orb-caption">{{ phase === 'checking' ? 'Checking sources' : 'Thinking' }}</span>
        </div>
        <div v-if="note" class="ai-msg error">{{ note }}</div>
      </div>

      <div :class="['ai-suggestions', { 'ax-compact-suggestions': messages.length > 0 }]">
        <button v-for="s in SUGGESTIONS" :key="s" :disabled="typing" @click="send(s)">{{ s }}</button>
      </div>

      <div class="ai-input">
        <textarea
          ref="inputRef"
          v-model="input"
          rows="2"
          aria-label="Message SmartMate"
          placeholder="Ask anything about your store…"
          @keydown.enter.exact.prevent="send()"
        />
        <button v-if="typing" class="ax-stop" aria-label="Stop generating" title="Stop generating" @click="stop">
          <Square :size="16" fill="currentColor" />
        </button>
        <button v-else class="send" aria-label="Send message" :disabled="!input.trim() || typing" @click="send()">
          <ArrowUp :size="19" />
        </button>
      </div>
      <div class="ax-footer"><span><ShieldCheck :size="12" /> Private by design</span><span>Enter to send · Shift + Enter for a new line</span></div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X, Wifi, WifiOff, Loader2, RefreshCw, Trash2, ArrowUp, Square, ShieldCheck, BookOpen, Maximize2, Minimize2 } from 'lucide-vue-next'
import AgentX, { type AgentState } from './AgentX.vue'
import { useStore } from '../store/useStore'
import { useBrowserAi } from '../store/browserAi'
import {
  buildSnapshot,
  buildAssistantSystemPrompt,
  offlineReply,
  resolveFollowUp,
  type AiMessage,
} from '../utils/ai'
import { buildKnowledgeContext } from '../utils/rag'
import { retrieveEvidence, decideAnswer, validateAnswer, buildEvidencePrompt } from '../utils/pipeline'
import { answerFromKnowledge } from '../utils/knowledgeAi'
import { browserModelLabel } from '../utils/browserLlm'
import { previousInventoryQuestion } from '../utils/inventoryLanguage'
import { productToTransactionItem } from '../app/data/bridge'

const SUGGESTIONS = ["Today's sales", 'Grade A phones under 400', 'Do we have Tom Holland movies in stock?']

const store = useStore()
const ai = useBrowserAi()
const enabled = computed(() => store.settings.aiEnabled)
const currency = computed(() => store.settings.currency)
const modelId = computed(() => store.settings.browserModel)

const open = ref(false)
const expanded = ref(false)
const input = ref('')
const typing = ref(false)
const phase = ref<'retrieving' | 'composing' | 'checking'>('retrieving')
const note = ref('')
const pendingCorrection = ref<string | undefined>()
const messages = ref<AiMessage[]>([])
const scrollRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const clock = ref(Date.now())
let timer: any = null
let activeRequest: AbortController | null = null

const snapshot = computed(() => buildSnapshot(store.products, store.sales, store.customers, store.settings))
const ready = computed(() => ai.status === 'ready' && ai.modelId === modelId.value)

const agentState = computed<AgentState>(() => {
  const last = messages.value[messages.value.length - 1]
  const lastWasError = last?.role === 'assistant' && note.value.length > 0
  if (typing.value) return phase.value === 'composing' ? 'answering' : 'thinking'
  return lastWasError ? 'error' : 'idle'
})

const statusLine = computed(() => {
  if (ai.status === 'unsupported') return { icon: WifiOff, text: 'WebGPU not available — use Chrome/Edge' }
  if (ai.status === 'loading') return { icon: Loader2, text: `Loading model… ${ai.progress}%` }
  if (ai.status === 'ready') return { icon: Wifi, text: `In-browser · ${browserModelLabel(ai.modelId ?? modelId.value)}` }
  if (ai.status === 'error') return { icon: WifiOff, text: 'Model failed — local answers' }
  return { icon: WifiOff, text: 'Model not loaded — local answers' }
})

function scrollToBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}

watch([messages, typing, () => ai.progress], scrollToBottom)
watch(open, (v) => { if (v) nextTick(() => inputRef.value?.focus()) })

watch([() => ai.status, () => ai.modelId, modelId], () => {
  if (!enabled.value) return
  if (ai.status === 'idle' || (ai.status === 'ready' && ai.modelId !== modelId.value)) {
    void ai.startLoad(modelId.value)
  }
}, { immediate: true })

onMounted(() => {
  timer = setInterval(() => { clock.value = Date.now() }, 60000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  activeRequest?.abort()
})

function stop() {
  activeRequest?.abort()
  activeRequest = null
  typing.value = false
}

function clearChat() {
  stop()
  pendingCorrection.value = undefined
  messages.value = []
  note.value = ''
  input.value = ''
  typing.value = false
}

function canAddToCart(productId: string) {
  const current = store.products.find((p) => p.id === productId)
  if (!current || current.stock <= 0) return false
  const reserved = store.cart.filter((row: any) => row.productId === productId && row.type === 'sell').reduce((sum: number, row: any) => sum + (row.qty || 0), 0)
  return current.stock > reserved
}

function addToCart(productId: string) {
  const current = store.products.find((p) => p.id === productId)
  if (!current || current.stock <= 0) return
  const item = productToTransactionItem(current, store.categories, 'sell')
  window.dispatchEvent(new CustomEvent('mepos:assistant-add-to-cart', { detail: item }))
}

async function send(text?: string) {
  const content = (text ?? input.value).trim()
  if (!content || typing.value) return
  const controller = new AbortController()
  activeRequest = controller
  note.value = ''
  input.value = ''
  typing.value = true
  phase.value = 'retrieving'

  const lastUser = previousInventoryQuestion(messages.value as any)
  let resolved = resolveFollowUp(content, lastUser, store.products.flatMap((p) => [p.name, p.sku]).concat(store.categories.map((c) => c.name)))
  if (pendingCorrection.value && /^\s*(yes|yeah|yep|ok|okay|sure|y|ya)\s*[!.?]?\s*$/i.test(content)) {
    resolved = `do we have ${pendingCorrection.value}?`
  }
  messages.value = [...messages.value, { role: 'user', content, resolvedQuery: resolved }]
  pendingCorrection.value = undefined
  scrollToBottom()

  const kbEnabled = store.settings.kbEnabled && store.knowledge.length > 0
  const kbContext = kbEnabled ? buildKnowledgeContext(store.knowledge, resolved) : ''

  const evidence = retrieveEvidence(resolved, {
    products: store.products,
    categories: store.categories,
    customers: store.customers,
    sales: store.sales,
    currency: store.settings.currency,
    attachedCustomerId: store.customerId,
    knowledge: store.knowledge,
    kbEnabled,
    skills: store.skills,
    skillsEnabled: store.settings.skillsEnabled,
    bankingContext: (store as any).bankingContext ?? undefined,
    snapshot: snapshot.value,
  })

  const decision = decideAnswer(evidence)
  const answerProducts = decision.winner === 'catalog' || decision.winner === 'compare'
    ? evidence.catalog.hits.filter((p) => decision.answer?.split('\n').some((line) => line.includes(p.name) && (!/grade [a-f]/i.test(line) || line.toLowerCase().includes(`grade ${p.grade.toLowerCase()}`)))).slice(0, 4)
    : []

  if (decision.winner === 'kb') {
    try {
      const result = await answerFromKnowledge(
        evidence,
        ready.value ? (history, signal) => ai.chat(modelId.value, history, { signal, onProgress: () => { if (!controller.signal.aborted) phase.value = 'composing' } }) : undefined,
        controller.signal,
        messages.value,
        (next) => { if (!controller.signal.aborted) phase.value = next },
      )
      if (controller.signal.aborted) return
      messages.value = [...messages.value, { role: 'assistant', content: result.content, sources: result.sources }]
      note.value = result.note
    } catch (error) {
      if (!controller.signal.aborted) note.value = 'Could not read the knowledge base. Please try again.'
    } finally {
      if (activeRequest === controller) {
        activeRequest = null
        typing.value = false
      }
    }
    return
  }

  if (decision.answer) {
    typing.value = false
    if (evidence.catalog.answer?.correctedQuery) pendingCorrection.value = evidence.catalog.answer.correctedQuery
    messages.value = [...messages.value, { role: 'assistant', content: decision.answer, products: answerProducts, sources: evidence.sources }]
    return
  }

  if (!ready.value) {
    typing.value = false
    messages.value = [...messages.value, {
      role: 'assistant',
      content: validateAnswer(offlineReply(resolved, snapshot.value, evidence.customer.ctx ?? undefined, evidence.customer.attachedName, store.settings.kbEnabled ? store.knowledge : [], store.products, store.categories), evidence),
    }]
    if (ai.status === 'error') note.value = `The local model failed to load — answered from built-in knowledge. (${ai.error || 'unknown error'})`
    else if (ai.status === 'loading') note.value = 'The model is still loading — answering from built-in knowledge for now.'
    return
  }

  const evidencePrompt = buildEvidencePrompt(evidence, snapshot.value, kbContext, decision.winner)
  const history: AiMessage[] = [
    { role: 'system', content: buildAssistantSystemPrompt(snapshot.value, kbContext, evidencePrompt, evidence.customer.attachedName, evidence.catalog.hits) },
    ...messages.value.slice(-12).map(({ role, content }) => ({ role, content })),
    { role: 'user', content: resolved },
  ]

  try {
    const answer = await ai.chat(modelId.value, history, {
      signal: controller.signal,
      onProgress: () => { if (!controller.signal.aborted) phase.value = 'composing' },
    })
    if (controller.signal.aborted) return
    phase.value = 'checking'
    const validated = validateAnswer(answer, evidence)
    messages.value = [...messages.value, { role: 'assistant', content: validated }]
  } catch (err) {
    if (controller.signal.aborted) return
    messages.value = [...messages.value, {
      role: 'assistant',
      content: validateAnswer(offlineReply(resolved, snapshot.value, evidence.customer.ctx ?? undefined, evidence.customer.attachedName, store.settings.kbEnabled ? store.knowledge : [], store.products, store.categories), evidence),
    }]
    note.value = `Local model error (${(err as Error).message}) — answered from built-in knowledge.`
  } finally {
    if (activeRequest === controller) {
      activeRequest = null
      typing.value = false
    }
  }
}
</script>
