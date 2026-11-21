import { createApp, defineComponent, h, ref, computed, onMounted, watch } from 'vue'
import './online.css'

type Product = {
  id: string
  name: string
  sku: string
  stock: number
  price: number
  requiresSerial: boolean
}
type Customer = { id: string; name: string; email: string; phone: string }
type Line = { id: string; name: string; qty: number; cents: number }
type Summary = {
  products: number
  customers: number
  sales: number
  tills: { id: string; name: string }[]
  currency: string
}
type Pending = {
  requestId: string
  till: string
  customer: string | null
  lines: { id: string; qty: number; cents: number }[]
}
type Session = { username: string; token: string }

class RequestError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function api<T>(url: string, token: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const r = await fetch('/api/' + url, {
    method: body === undefined ? 'GET' : 'POST',
    cache: 'no-store',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new RequestError(r.status, (data as any).error ?? 'Request failed.')
  return data as T
}

const errorText = (e: unknown) => e instanceof Error ? e.message : 'Database unavailable.'

const Lookup = defineComponent({
  props: { token: { type: String, required: true }, currency: { type: String, required: true } },
  setup(props) {
    const answer = ref('')
    const loading = ref(false)
    const term = ref('')
    async function onSubmit(e: Event) {
      e.preventDefault()
      const q = term.value.trim()
      if (!q || loading.value) return
      loading.value = true
      answer.value = ''
      try {
        const r = await api<{
          boxes: { name: string; boxId: string; stockLevel: number; sellPrice: number }[]
          customers: { name: string }[]
          orders: { orderNumber: string; total: number }[]
          truncated: boolean
        }>('search', props.token, { query: q })
        const lines = [
          ...r.boxes.map((p) => `${p.name} (${p.boxId}): ${p.stockLevel} in stock · ${props.currency}${p.sellPrice.toFixed(2)}`),
          ...r.customers.map((c) => 'Customer: ' + c.name),
          ...r.orders.map((o) => `Receipt ${o.orderNumber} · ${props.currency}${o.total.toFixed(2)}`),
        ]
        let out = lines.slice(0, 10).join('\n') || 'No matches.'
        if (lines.length > 10 || r.truncated) out += '\nType more to narrow your search.'
        answer.value = out
      } catch (err) {
        answer.value = errorText(err)
      } finally {
        loading.value = false
      }
    }
    return () => h('details', [
      h('summary', 'SmartMate lookup'),
      h('form', { onSubmit }, [
        h('label', ['Product, customer or receipt', h('input', { value: term.value, maxLength: 200, required: true, onInput: (e: any) => term.value = e.target.value })]),
        h('button', { disabled: loading.value }, loading.value ? 'Searching…' : 'Look up'),
      ]),
      h('p', { class: 'lookup-result', role: 'status' }, answer.value),
    ])
  }
})

const AddRecord = defineComponent({
  props: { kind: { type: String as () => 'products' | 'customers', required: true }, token: { type: String, required: true } },
  emits: ['saved'],
  setup(props, { emit }) {
    const message = ref('')
    const saving = ref(false)
    const product = computed(() => props.kind === 'products')
    async function onSubmit(e: Event) {
      e.preventDefault()
      if (saving.value) return
      const form = e.currentTarget as HTMLFormElement
      const f = new FormData(form)
      const data = product.value
        ? { sku: f.get('sku'), cents: Math.round(Number(f.get('price')) * 100), stock: Number(f.get('stock')) }
        : { email: f.get('email'), phone: f.get('phone') }
      saving.value = true
      message.value = ''
      try {
        await api('online/records', props.token, { kind: props.kind, name: f.get('name'), ...data })
        form.reset()
        message.value = 'Saved.'
        emit('saved')
      } catch (err) {
        message.value = errorText(err)
      } finally {
        saving.value = false
      }
    }
    return () => h('details', [
      h('summary', product.value ? 'Add product' : 'Add customer'),
      h('form', { onSubmit }, [
        h('label', ['Name', h('input', { name: 'name', maxLength: 200, required: true })]),
        product.value ? [
          h('label', ['SKU', h('input', { name: 'sku', maxLength: 100, required: true })]),
          h('label', ['Unit price', h('input', { type: 'number', name: 'price', min: '0', max: '9999999.99', step: '0.01', required: true })]),
          h('label', ['Opening stock', h('input', { type: 'number', name: 'stock', min: '0', max: '2147483647', step: '1', required: true })]),
        ] : [
          h('label', ['Email', h('input', { type: 'email', name: 'email', maxLength: 254 })]),
          h('label', ['Phone', h('input', { name: 'phone', maxLength: 40 })]),
        ],
        h('button', { disabled: saving.value }, `Save ${product.value ? 'product' : 'customer'}`),
        h('p', { role: 'status' }, message.value),
      ]),
    ])
  }
})

const Register = defineComponent({
  props: { session: { type: Object as () => Session, required: true } },
  emits: ['logout'],
  setup(props, { emit }) {
    const token = props.session.token
    const pendingKey = 'mepos-online-pending:' + props.session.username
    const pending = ref<Pending | null>(JSON.parse(sessionStorage.getItem(pendingKey) ?? 'null'))
    const kind = ref<'products' | 'customers'>('products')
    const term = ref('')
    const page = ref(0)
    const version = ref(0)
    const summary = ref<Summary | undefined>()
    const till = ref('')
    const customer = ref<Customer | null>(null)
    const cart = ref<Line[]>([])
    const notice = ref('')
    const busy = ref(false)
    const result = ref<{ key: string; rows: (Product | Customer)[]; more: boolean; error?: string } | undefined>()
    const key = computed(() => JSON.stringify([kind.value, term.value, page.value, version.value]))
    const current = computed(() => result.value?.key === key.value ? result.value : undefined)
    const money = (c: number) => (summary.value?.currency ?? '') + (c / 100).toFixed(2)

    let summaryAbort: AbortController | null = null
    async function loadSummary() {
      summaryAbort?.abort()
      summaryAbort = new AbortController()
      try {
        const s = await api<Summary>('online/summary', token, undefined, summaryAbort.signal)
        summary.value = s
        if (!till.value) till.value = s.tills[0]?.id || ''
      } catch (e) {
        if (!(e as any)?.name?.includes?.('Abort')) notice.value = errorText(e)
      }
    }

    let dirAbort: AbortController | null = null
    let dirTimer: any = null
    function loadDirectory() {
      clearTimeout(dirTimer)
      dirAbort?.abort()
      dirAbort = new AbortController()
      const k = key.value
      const curKind = kind.value
      const curTerm = term.value
      const curPage = page.value
      dirTimer = setTimeout(async () => {
        try {
          const data = await api<{ rows: (Product | Customer)[]; more: boolean }>('online/directory', token, { kind: curKind, term: curTerm, page: curPage }, dirAbort!.signal)
          if (!dirAbort!.signal.aborted) result.value = { key: k, ...data }
        } catch (e) {
          if (!dirAbort!.signal.aborted) result.value = { key: k, rows: [], more: false, error: errorText(e) }
        }
      }, 180)
    }

    onMounted(() => { loadSummary(); loadDirectory() })
    watch([kind, term, page, version], loadDirectory)
    watch(version, loadSummary)

    async function checkout() {
      if (busy.value) return
      busy.value = true
      try {
        const op = pending.value ?? {
          requestId: crypto.randomUUID(),
          till: till.value,
          customer: customer.value?.id ?? null,
          lines: cart.value.map(({ id, qty, cents }) => ({ id, qty, cents })),
        }
        sessionStorage.setItem(pendingKey, JSON.stringify(op))
        pending.value = op
        const receipt = await api<{ receiptNo: string; total: number }>('online/checkout', token, op)
        sessionStorage.removeItem(pendingKey)
        pending.value = null
        cart.value = []
        customer.value = null
        notice.value = `Receipt ${receipt.receiptNo} · ${money(Math.round(receipt.total * 100))}`
        version.value++
      } catch (e) {
        if (e instanceof RequestError && e.status === 409) {
          sessionStorage.removeItem(pendingKey)
          pending.value = null
        }
        notice.value = errorText(e)
      } finally {
        busy.value = false
      }
    }

    function addProductRow(row: Product) {
      const old = cart.value.find((l) => l.id === row.id)
      if (old) old.qty = Math.min(row.stock, old.qty + 1)
      else cart.value.push({ id: row.id, name: row.name, qty: 1, cents: Math.round(row.price * 100) })
    }

    return () => h('main', [
      h('header', [h('h1', 'MEPoS Online'), h('button', { onClick: () => emit('logout') }, 'Sign out')]),
      summary.value ? h('p', `${summary.value.products} products · ${summary.value.customers} customers · ${summary.value.sales} transactions`) : null,
      h(Lookup, { token, currency: summary.value?.currency ?? '' }),
      h('div', { class: 'columns' }, [
        h('section', [
          h('div', { class: 'bar' }, (['products', 'customers'] as const).map((k) => h('button', {
            key: k, 'aria-pressed': kind.value === k ? 'true' : 'false',
            onClick: () => { kind.value = k; page.value = 0; term.value = '' }
          }, k === 'products' ? 'Products' : 'Customers'))),
          h(AddRecord, { key: kind.value, token, kind: kind.value, onSaved: () => { term.value = ''; page.value = 0; version.value++ } }),
          h('input', { 'aria-label': 'Search ' + kind.value, placeholder: 'Search ' + kind.value, value: term.value, maxLength: 200, onInput: (e: any) => { term.value = e.target.value; page.value = 0 } }),
          !current.value ? h('p', 'Loading…') : current.value.error ? h('p', { role: 'alert' }, [current.value.error + ' ', h('button', { onClick: () => version.value++ }, 'Retry')]) : [
            h('ul', current.value.rows.map((row: any) => h('li', { key: row.id }, [
              h('div', [
                h('strong', row.name),
                h('small', 'sku' in row ? `${row.sku} · ${row.stock} in stock · ${money(Math.round(row.price * 100))}` : [row.email, row.phone].filter(Boolean).join(' · ')),
              ]),
              'sku' in row
                ? h('button', { disabled: !!pending.value || row.stock < 1 || row.requiresSerial, onClick: () => addProductRow(row) }, row.requiresSerial ? 'Serial required' : 'Add')
                : h('button', { disabled: !!pending.value, onClick: () => { customer.value = row as Customer } }, 'Attach'),
            ]))),
            !current.value.rows.length ? h('p', 'No matches.') : null,
            h('nav', [
              h('button', { disabled: !page.value, onClick: () => page.value-- }, 'Previous'),
              ` Page ${page.value + 1} `,
              h('button', { disabled: !current.value.more, onClick: () => page.value++ }, 'Next'),
            ]),
          ],
        ]),
        h('section', [
          h('h2', 'Cash sale'),
          h('label', ['Till ', h('select', { value: till.value, disabled: !!pending.value, onChange: (e: any) => till.value = e.target.value }, [
            h('option', { value: '' }, 'Select an open till'),
            ...(summary.value?.tills ?? []).map((t) => h('option', { key: t.id, value: t.id }, t.name)),
          ])]),
          h('p', [customer.value?.name ?? 'Walk-in customer', customer.value ? h('button', { disabled: !!pending.value, onClick: () => { customer.value = null } }, 'Detach') : null]),
          h('ul', cart.value.map((l) => h('li', { key: l.id }, [
            `${l.qty} × ${l.name}`,
            h('button', { disabled: !!pending.value, onClick: () => { cart.value = cart.value.filter((r) => r.id !== l.id) } }, 'Remove'),
          ]))),
          pending.value ? h('p', 'A checkout is awaiting confirmation. Retry to retrieve its receipt.') : null,
          h('button', {
            disabled: busy.value || (!pending.value && (!cart.value.length || !till.value)),
            onClick: checkout,
          }, pending.value ? 'Retry checkout' : `Record exact cash ${money(cart.value.reduce((sum, l) => sum + l.qty * l.cents, 0))}`),
          h('p', { role: 'status' }, notice.value),
        ]),
      ]),
    ])
  }
})

const App = defineComponent({
  setup() {
    const session = ref<Session | null>(null)
    const error = ref('')
    async function onSubmit(e: Event) {
      e.preventDefault()
      const f = new FormData(e.currentTarget as HTMLFormElement)
      const username = String(f.get('username') || '')
      try {
        const { token } = await api<{ token: string }>('auth/login', '', { username, password: f.get('password') })
        session.value = { username, token }
        error.value = ''
      } catch (err) {
        error.value = errorText(err)
      }
    }
    return () => session.value
      ? h(Register, { session: session.value, onLogout: () => { session.value = null; error.value = '' } })
      : h('main', { class: 'login' }, [
          h('h1', 'MEPoS Online'),
          h('form', { onSubmit }, [
            h('label', ['Username', h('input', { name: 'username', autocomplete: 'username', required: true })]),
            h('label', ['Password', h('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true })]),
            h('button', 'Sign in'),
            h('p', { role: 'alert' }, error.value),
          ]),
        ])
  }
})

createApp(App).mount('#root')
