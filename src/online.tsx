import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
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
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
async function api<T>(
  url: string,
  token: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
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
  const data = await r.json()
  if (!r.ok) throw new RequestError(r.status, data.error ?? 'Request failed.')
  return data
}
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : 'Database unavailable.'

function Lookup({ token, currency }: { token: string; currency: string }) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <details>
      <summary>SmartMate lookup</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const term = String(
            new FormData(e.currentTarget).get('term') ?? '',
          ).trim()
          if (!term || loading) return
          setLoading(true)
          setAnswer('')
          try {
            const r = await api<{
              boxes: {
                name: string
                boxId: string
                stockLevel: number
                sellPrice: number
              }[]
              customers: { name: string }[]
              orders: { orderNumber: string; total: number }[]
              truncated: boolean
            }>('search', token, { query: term })
            const lines = [
              ...r.boxes.map(
                (p) =>
                  p.name +
                  ' (' +
                  p.boxId +
                  '): ' +
                  p.stockLevel +
                  ' in stock · ' +
                  currency +
                  p.sellPrice.toFixed(2),
              ),
              ...r.customers.map((c) => 'Customer: ' + c.name),
              ...r.orders.map(
                (o) =>
                  'Receipt ' +
                  o.orderNumber +
                  ' · ' +
                  currency +
                  o.total.toFixed(2),
              ),
            ]
            setAnswer(lines.slice(0, 10).join('\n') || 'No matches.')
            if (lines.length > 10 || r.truncated)
              setAnswer((a) => a + '\nType more to narrow your search.')
          } catch (e) {
            setAnswer(errorText(e))
          } finally {
            setLoading(false)
          }
        }}
      >
        <label>
          Product, customer or receipt
          <input name="term" maxLength={200} required />
        </label>
        <button disabled={loading}>{loading ? 'Searching…' : 'Look up'}</button>
      </form>
      <p className="lookup-result" role="status">
        {answer}
      </p>
    </details>
  )
}
function AddRecord({
  kind,
  token,
  onSaved,
}: {
  kind: 'products' | 'customers'
  token: string
  onSaved: () => void
}) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const product = kind === 'products'
  return (
    <details>
      <summary>{product ? 'Add product' : 'Add customer'}</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (saving) return
          const form = e.currentTarget
          const f = new FormData(form)
          const data = product
            ? {
                sku: f.get('sku'),
                cents: Math.round(Number(f.get('price')) * 100),
                stock: Number(f.get('stock')),
              }
            : { email: f.get('email'), phone: f.get('phone') }
          setSaving(true)
          setMessage('')
          try {
            await api('online/records', token, {
              kind,
              name: f.get('name'),
              ...data,
            })
            form.reset()
            setMessage('Saved.')
            onSaved()
          } catch (err) {
            setMessage(errorText(err))
          } finally {
            setSaving(false)
          }
        }}
      >
        <label>
          Name
          <input name="name" maxLength={200} required />
        </label>
        {product ? (
          <>
            <label>
              SKU
              <input name="sku" maxLength={100} required />
            </label>
            <label>
              Unit price
              <input
                type="number"
                name="price"
                min="0"
                max="9999999.99"
                step="0.01"
                required
              />
            </label>
            <label>
              Opening stock
              <input
                type="number"
                name="stock"
                min="0"
                max="2147483647"
                step="1"
                required
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Email
              <input type="email" name="email" maxLength={254} />
            </label>
            <label>
              Phone
              <input name="phone" maxLength={40} />
            </label>
          </>
        )}
        <button disabled={saving}>
          Save {product ? 'product' : 'customer'}
        </button>
        <p role="status">{message}</p>
      </form>
    </details>
  )
}

function Register({
  session,
  logout,
}: {
  session: Session
  logout: () => void
}) {
  const { token } = session
  const pendingKey = 'mepos-online-pending:' + session.username
  const [pending, setPending] = useState<Pending | null>(() =>
    JSON.parse(sessionStorage.getItem(pendingKey) ?? 'null'),
  )
  const [kind, setKind] = useState<'products' | 'customers'>('products')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(0)
  const [version, refresh] = useState(0)
  const [summary, setSummary] = useState<Summary>()
  const [till, setTill] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<Line[]>([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const key = JSON.stringify([kind, term, page, version])
  const [result, setResult] = useState<{
    key: string
    rows: (Product | Customer)[]
    more: boolean
    error?: string
  }>()
  const current = result?.key === key ? result : undefined
  useEffect(() => {
    const c = new AbortController()
    api<Summary>('online/summary', token, undefined, c.signal)
      .then((s) => {
        setSummary(s)
        setTill((t) => t || s.tills[0]?.id || '')
      })
      .catch((e) => {
        if (!c.signal.aborted) setNotice(errorText(e))
      })
    return () => c.abort()
  }, [token, version])
  useEffect(() => {
    const c = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await api<{ rows: (Product | Customer)[]; more: boolean }>(
          'online/directory',
          token,
          { kind, term, page },
          c.signal,
        )
        if (!c.signal.aborted) setResult({ key, ...data })
      } catch (e) {
        if (!c.signal.aborted)
          setResult({ key, rows: [], more: false, error: errorText(e) })
      }
    }, 180)
    return () => {
      clearTimeout(timer)
      c.abort()
    }
  }, [key, kind, term, page, token])
  const money = (c: number) => (summary?.currency ?? '') + (c / 100).toFixed(2)
  async function checkout() {
    if (busy) return
    setBusy(true)
    try {
      const op = pending ?? {
        requestId: crypto.randomUUID(),
        till,
        customer: customer?.id ?? null,
        lines: cart.map(({ id, qty, cents }) => ({ id, qty, cents })),
      }
      sessionStorage.setItem(pendingKey, JSON.stringify(op))
      setPending(op)
      const receipt = await api<{ receiptNo: string; total: number }>(
        'online/checkout',
        token,
        op,
      )
      sessionStorage.removeItem(pendingKey)
      setPending(null)
      setCart([])
      setCustomer(null)
      setNotice(
        'Receipt ' +
          receipt.receiptNo +
          ' · ' +
          money(Math.round(receipt.total * 100)),
      )
      refresh((v) => v + 1)
    } catch (e) {
      if (e instanceof RequestError && e.status === 409) {
        sessionStorage.removeItem(pendingKey)
        setPending(null)
      }
      setNotice(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main>
      <header>
        <h1>MEPoS Online</h1>
        <button onClick={logout}>Sign out</button>
      </header>
      {summary && (
        <p>
          {summary.products} products · {summary.customers} customers ·{' '}
          {summary.sales} transactions
        </p>
      )}
      <Lookup token={token} currency={summary?.currency ?? ''} />
      <div className="columns">
        <section>
          <div className="bar">
            {(['products', 'customers'] as const).map((k) => (
              <button
                key={k}
                aria-pressed={kind === k}
                onClick={() => {
                  setKind(k)
                  setPage(0)
                  setTerm('')
                }}
              >
                {k === 'products' ? 'Products' : 'Customers'}
              </button>
            ))}
          </div>
          <AddRecord
            key={kind}
            token={token}
            kind={kind}
            onSaved={() => {
              setTerm('')
              setPage(0)
              refresh((v) => v + 1)
            }}
          />
          <input
            aria-label={'Search ' + kind}
            placeholder={'Search ' + kind}
            value={term}
            maxLength={200}
            onChange={(e) => {
              setTerm(e.target.value)
              setPage(0)
            }}
          />
          {!current ? (
            <p>Loading…</p>
          ) : current.error ? (
            <p role="alert">
              {current.error}{' '}
              <button onClick={() => refresh((v) => v + 1)}>Retry</button>
            </p>
          ) : (
            <>
              <ul>
                {current.rows.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong>{row.name}</strong>
                      <small>
                        {'sku' in row
                          ? row.sku +
                            ' · ' +
                            row.stock +
                            ' in stock · ' +
                            money(Math.round(row.price * 100))
                          : [row.email, row.phone].filter(Boolean).join(' · ')}
                      </small>
                    </div>
                    {'sku' in row ? (
                      <button
                        disabled={
                          !!pending || row.stock < 1 || row.requiresSerial
                        }
                        onClick={() =>
                          setCart((lines) => {
                            const old = lines.find((l) => l.id === row.id)
                            return old
                              ? lines.map((l) =>
                                  l === old
                                    ? {
                                        ...l,
                                        qty: Math.min(row.stock, l.qty + 1),
                                      }
                                    : l,
                                )
                              : [
                                  ...lines,
                                  {
                                    id: row.id,
                                    name: row.name,
                                    qty: 1,
                                    cents: Math.round(row.price * 100),
                                  },
                                ]
                          })
                        }
                      >
                        {row.requiresSerial ? 'Serial required' : 'Add'}
                      </button>
                    ) : (
                      <button
                        disabled={!!pending}
                        onClick={() => setCustomer(row)}
                      >
                        Attach
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {!current.rows.length && <p>No matches.</p>}
              <nav>
                <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>{' '}
                Page {page + 1}{' '}
                <button
                  disabled={!current.more}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          )}
        </section>
        <section>
          <h2>Cash sale</h2>
          <label>
            Till{' '}
            <select
              value={till}
              disabled={!!pending}
              onChange={(e) => setTill(e.target.value)}
            >
              <option value="">Select an open till</option>
              {summary?.tills.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            {customer?.name ?? 'Walk-in customer'}{' '}
            {customer && (
              <button disabled={!!pending} onClick={() => setCustomer(null)}>
                Detach
              </button>
            )}
          </p>
          <ul>
            {cart.map((l) => (
              <li key={l.id}>
                {l.qty} × {l.name}
                <button
                  disabled={!!pending}
                  onClick={() =>
                    setCart((lines) => lines.filter((r) => r.id !== l.id))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {pending && (
            <p>
              A checkout is awaiting confirmation. Retry to retrieve its
              receipt.
            </p>
          )}
          <button
            disabled={busy || (!pending && (!cart.length || !till))}
            onClick={checkout}
          >
            {pending
              ? 'Retry checkout'
              : 'Record exact cash ' +
                money(cart.reduce((sum, l) => sum + l.qty * l.cents, 0))}
          </button>
          <p role="status">{notice}</p>
        </section>
      </div>
    </main>
  )
}
function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')
  if (session)
    return (
      <Register
        session={session}
        logout={() => {
          setSession(null)
          setError('')
        }}
      />
    )
  return (
    <main className="login">
      <h1>MEPoS Online</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          const username = String(f.get('username'))
          try {
            const { token } = await api<{ token: string }>('auth/login', '', {
              username,
              password: f.get('password'),
            })
            setSession({ username, token })
          } catch (err) {
            setError(errorText(err))
          }
        }}
      >
        <label>
          Username
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button>Sign in</button>
        <p role="alert">{error}</p>
      </form>
    </main>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
