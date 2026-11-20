import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
const base = 'http://localhost:' + process.env.PORT
const login = await fetch(base + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  }),
})
assert.equal(login.status, 200)
const { token } = await login.json()
const headers = {
  Authorization: 'Bearer ' + token,
  'Content-Type': 'application/json',
}
function get(path) {
  return fetch(base + path, { headers })
}
function post(path, data) {
  return fetch(base + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
}
if (process.argv[2] === 'fresh') {
  const summary = await (await get('/api/online/summary')).json()
  assert.deepEqual(
    [summary.products, summary.customers, summary.sales],
    [0, 0, 0],
  )
  assert.equal(summary.tills[0].id, 'front')
  const product = {
    kind: 'products',
    name: 'Starter product',
    sku: 'FIRST',
    stock: 3,
    cents: 200,
  }
  assert.equal((await post('/api/online/records', product)).status, 201)
  assert.equal((await post('/api/online/records', product)).status, 409)
  assert.equal(
    (
      await post('/api/online/records', {
        kind: 'customers',
        name: 'Starter customer',
        email: '',
        phone: '',
      })
    ).status,
    201,
  )
  console.log(
    'Empty database: migrations, first admin login, open till and UI record APIs passed.',
  )
} else if (process.argv[2] === 'rollback') {
  assert.doesNotMatch(await (await get('/')).text(), /MEPoS Online/)
  const { data } = await (await get('/api/state')).json()
  assert.equal(data.sales.length, 2)
  assert.equal(data.products.find((p) => p.id === 'p1').stock, 0)
  assert.equal(data.customers.length, 10002)
  console.log('Rollback: legacy loaded both receipts and correct stock.')
} else {
  assert.match(await (await get('/')).text(), /MEPoS Online/)
  assert.equal((await get('/api/state')).status, 409)
  assert.equal(
    (await fetch(base + '/api/state', { method: 'PUT', headers, body: '{}' }))
      .status,
    409,
  )
  assert.equal((await get('/api/backup')).status, 409)
  assert.equal((await fetch(base + '/api/online/summary')).status, 401)
  const counts = await (await get('/api/online/summary')).json()
  assert.equal(counts.products, 10002)
  assert.equal(counts.customers, 10002)
  for (const kind of ['products', 'customers']) {
    const first = await (
      await post('/api/online/directory', { kind, term: '', page: 0 })
    ).json()
    const next = await (
      await post('/api/online/directory', { kind, term: '', page: 1 })
    ).json()
    assert.equal(first.rows.length, 25)
    assert.equal(first.more, true)
    assert.equal(
      new Set([...first.rows, ...next.rows].map((r) => r.id)).size,
      50,
    )
  }
  const lookup = await (await post('/api/search', { query: 'sku10001' })).json()
  assert.equal(lookup.boxes.length, 1)
  const sale = (id) => ({
    requestId: randomUUID(),
    till: 't',
    customer: 'c1',
    lines: [{ id, qty: 1, cents: 1000 }],
  })
  const checkout = (data) => post('/api/online/checkout', data)
  const first = sale('p1')
  const [a, b] = await Promise.all([checkout(first), checkout(first)])
  assert.equal(a.status, 200)
  assert.deepEqual(await a.json(), await b.json())
  const race = await Promise.all([checkout(sale('p2')), checkout(sale('p2'))])
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409])
  const invalid = sale('p3')
  invalid.lines.push({ id: 'p2', qty: 1, cents: 1000 })
  assert.equal((await checkout(invalid)).status, 409)
  const unchanged = await (await post('/api/search', { query: 'sku3' })).json()
  assert.equal(unchanged.boxes.find((p) => p.boxId === 'sku3').stockLevel, 1)
  console.log(
    'Online: 10,001 products and customers, pagination, lookup, retry, concurrency and transaction rollback passed.',
  )
}
