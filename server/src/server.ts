import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { initializeStore } from './bootstrap.js'
import { onlineApi } from './online.js'
import { searchStore } from './search.js'
import { normalizeState, toTableRows } from './state.js'

const app = express()
const online = process.env.POS_MODE !== 'legacy'
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Online mode needs DATABASE_URL and a JWT_SECRET of at least 32 characters.')
}
const PORT = Number(process.env.PORT || 3000)
const CORS_ORIGIN = process.env.CORS_ORIGIN || false
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }))
app.use(express.json({ limit: '10mb' }))

let prisma: any
async function initPrisma() {
  const { PrismaClient } = await import('@prisma/client')
  prisma = new PrismaClient()
  await prisma.$connect()
  await initializeStore(prisma)
}

// --- Auth helpers ---
function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as never)
}
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>
    ;(req as unknown as Record<string, unknown>).user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Helpers to convert BigInt fields for JSON (Prisma returns BigInt, frontend expects number)
function toNum(v: unknown): number {
  return typeof v === 'bigint' ? Number(v) : (v as number)
}
function mapSale(s: Record<string, unknown>): Record<string, unknown> {
  return {
    ...s,
    createdAt: toNum(s.createdAt),
    refundedAt: s.refundedAt != null ? toNum(s.refundedAt) : undefined,
  }
}

async function readStateFromTables(): Promise<Record<string, unknown> | null> {
  try {
    const [categories, products, customers, salesRaw, vouchers, knowledge, skills, tills, savedCarts, settingsRow] = await Promise.all([
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.sale.findMany({ include: { items: true } }),
      prisma.giftVoucher.findMany(),
      prisma.knowledgeDoc.findMany(),
      prisma.aiSkill.findMany(),
      prisma.till.findMany(),
      prisma.savedCart.findMany(),
      prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    ])
  const hasData = categories.length || products.length || customers.length || salesRaw.length || vouchers.length || knowledge.length || skills.length || tills.length || savedCarts.length || settingsRow
  if (!hasData) return null
  const sales = salesRaw.map((s: Record<string, unknown>) => ({
    ...mapSale(s as Record<string, unknown>),
    items: ((s as Record<string, unknown>).items as Record<string, unknown>[]).map((it) => ({
      productId: it.productId,
      name: it.name,
      price: it.price,
      qty: it.qty,
    })),
  }))
  return {
    categories,
    products: (products as Record<string, unknown>[]).map((p) => ({ ...p, createdAt: toNum(p.createdAt) })),
    customers: (customers as Record<string, unknown>[]).map((c) => ({ ...c, createdAt: toNum(c.createdAt) })),
    sales,
    vouchers: (vouchers as Record<string, unknown>[]).map((v) => ({ ...v, createdAt: toNum(v.createdAt) })),
    knowledge: (knowledge as Record<string, unknown>[]).map((k) => ({ ...k, updatedAt: toNum(k.updatedAt) })),
    skills: (skills as Record<string, unknown>[]).map((sk) => ({ ...sk, updatedAt: toNum(sk.updatedAt) })),
    tills: (tills as Record<string, unknown>[]).map((t) => ({
      ...t,
      openedAt: t.openedAt != null ? toNum(t.openedAt) : undefined,
      closedAt: t.closedAt != null ? toNum(t.closedAt) : undefined,
    })),
    savedCarts: (savedCarts as Record<string, unknown>[]).map((sc) => ({ ...sc, createdAt: toNum(sc.createdAt) })),
    settings: settingsRow
      ? {
          storeName: (settingsRow as Record<string, unknown>).storeName,
          tagline: (settingsRow as Record<string, unknown>).tagline,
          currency: (settingsRow as Record<string, unknown>).currency,
          taxRate: (settingsRow as Record<string, unknown>).taxRate,
          receiptFooter: (settingsRow as Record<string, unknown>).receiptFooter,
          aiEnabled: (settingsRow as Record<string, unknown>).aiEnabled,
          browserModel: (settingsRow as Record<string, unknown>).browserModel,
          kbEnabled: (settingsRow as Record<string, unknown>).kbEnabled,
          skillsEnabled: (settingsRow as Record<string, unknown>).skillsEnabled,
        }
      : undefined,
    activeTillId: (settingsRow as Record<string, unknown> | null)?.activeTillId ?? undefined,
  }
  } catch {
    return null
  }
}

async function writeStateToTables(data: Record<string, unknown>): Promise<void> {
  // Normalise first: unknown client fields and dangling customer/category
  // references would otherwise fail the whole Prisma batch and lose the save.
  const state = normalizeState(data)
  const rows = toTableRows(state)

  // Replace all data atomically so a failed save never leaves a half-written store.
  await prisma.$transaction(async (tx: Record<string, any>) => {
    await tx.saleItem.deleteMany({})
    await tx.sale.deleteMany({})
    await tx.savedCart.deleteMany({})
    await tx.giftVoucher.deleteMany({})
    // Customers after sales/vouchers to avoid FK issues, products after categories
    await tx.customer.deleteMany({})
    await tx.product.deleteMany({})
    await tx.category.deleteMany({})
    await tx.knowledgeDoc.deleteMany({})
    await tx.aiSkill.deleteMany({})
    await tx.till.deleteMany({})

    if (rows.categories.length) await tx.category.createMany({ data: rows.categories })
    if (rows.products.length) await tx.product.createMany({ data: rows.products })
    if (rows.customers.length) await tx.customer.createMany({ data: rows.customers })
    for (const { items, ...sale } of rows.sales) {
      await tx.sale.create({ data: { ...sale, items: { create: items } } })
    }
    if (rows.vouchers.length) await tx.giftVoucher.createMany({ data: rows.vouchers })
    if (rows.knowledge.length) await tx.knowledgeDoc.createMany({ data: rows.knowledge })
    if (rows.skills.length) await tx.aiSkill.createMany({ data: rows.skills })
    if (rows.tills.length) await tx.till.createMany({ data: rows.tills })
    if (rows.savedCarts.length) await tx.savedCart.createMany({ data: rows.savedCarts })
    if (rows.settings) {
      await tx.appSettings.upsert({
        where: { id: 'singleton' },
        update: rows.settings,
        create: { id: 'singleton', ...rows.settings },
      })
    }
  })

  // Keep legacy StoreState in sync for rollback
  try {
    await prisma.storeState.upsert({ where: { id: 'singleton' }, update: { data: state }, create: { id: 'singleton', data: state } })
  } catch {}
}

// --- API ---

app.get('/api/health', async (_req, res) => {
  res.set('Cache-Control', 'no-store')
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, mode: 'postgres', register: online ? 'online' : 'legacy' })
  } catch {
    res.status(503).json({ ok: false, mode: 'unavailable' })
  }
})

// Auth — public
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ id: user.id, username: user.username, role: 'admin' })
    return res.json({ token, username: user.username })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as unknown as Record<string, unknown>).user
  res.json({ user })
})

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true })
})

if (online) {
  app.use(['/api/state', '/api/backup'], (_req, res) => {
    res.status(409).json({ error: 'Whole-store sync is disabled in online mode.' })
  })
  app.use('/api/online', authMiddleware, onlineApi(() => prisma))
}

app.post('/api/search', authMiddleware, async (req, res) => {
  res.set('Cache-Control', 'no-store')
  const query = req.body?.query
  if (typeof query !== 'string' || !query.trim() || query.length > 200) {
    return res.status(400).json({ error: 'Enter a search term of 1 to 200 characters.' })
  }
  try {
    res.json(await searchStore(prisma, query.trim(), req.body.customersOnly === true))
  } catch {
    res.status(503).json({ error: 'Database search unavailable.' })
  }
})

app.get('/api/state', authMiddleware, async (_req, res) => {
  try {
    const data = await readStateFromTables()
    if (data) return res.json({ data })
    const row = await prisma.storeState.findUnique({ where: { id: 'singleton' } })
    if (row) return res.json({ data: row.data })
    return res.json({ data: null })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load state' })
  }
})

app.put('/api/state', authMiddleware, async (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'Invalid body' })
  const state = normalizeState(data)
  const counts = {
    categories: state.categories.length,
    products: state.products.length,
    customers: state.customers.length,
    sales: state.sales.length,
    knowledge: state.knowledge.length,
  }
  try {
    await writeStateToTables(data as Record<string, unknown>)
    return res.json({ ok: true, mode: 'postgres', counts })
  } catch (e) {
    console.error('[server] Failed to save state:', e)
    res.status(500).json({ error: 'Failed to save state', detail: (e as Error).message })
  }
})

// Optional: single-entity endpoints for future granular sync (currently whole-state is enough)
app.get('/api/backup', authMiddleware, async (_req, res) => {
  try {
    const data = await readStateFromTables()
    if (data) return res.json(data)
    const row = await prisma.storeState.findUnique({ where: { id: 'singleton' } })
    return res.json(row?.data ?? null)
  } catch (e) {
    res.status(500).json({ error: 'Failed' })
  }
})

// --- Serve frontend static (dist) when present (Render build puts dist at ../dist) ---
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// server/dist/server.js -> project dist is at ../../dist
const candidates = [
  path.join(__dirname, '../../dist'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '../dist'),
]
let staticDir: string | null = null
for (const c of candidates) {
  if (fs.existsSync(path.join(c, 'index.html'))) { staticDir = c; break }
}
if (staticDir) {
  console.log('[server] Serving static from', staticDir)
  const entry = path.join(staticDir, online ? 'online.html' : 'index.html')
  app.get(['/', '/online.html', '/index.html'], (_req, res) => res.set('Cache-Control','no-store').sendFile(entry))
  app.use(express.static(staticDir))
  // HashRouter needs no rewrite, but handle direct /admin/* etc. fallback to index.html for BrowserRouter safety
  app.get('*', (_req, res) => {
    res.set('Cache-Control','no-store').sendFile(entry)
  })
} else {
  console.log('[server] No static dist found — API only mode. Run `npm run build` in pos-app first.')
  app.get('/', (_req, res) => res.send('MEPoS API running — build frontend with `npm run build` to serve UI'))
}

await initPrisma()
app.listen(PORT, () => console.log(`[server] MEPoS dynamic server listening on :${PORT}`))
