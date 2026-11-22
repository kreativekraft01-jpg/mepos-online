import type { PrismaClient } from '@prisma/client'

type Obj = Record<string, unknown>

export interface AiContextRequest {
  question: string
  attachedCustomerId?: string | null
  bankingContext?: Obj | null
}

function toNum(v: unknown): number {
  return typeof v === 'bigint' ? Number(v) : (v as number)
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length >= 2)
}

function looksLikeCustomerQuestion(q: string): boolean {
  return /\b(customer|customers|client|clients|buyer|buyers|purchase history|bought|spent|spend|owe|owes|credit|balance|loyalty|contact|email|phone|who bought|top customer|repeat customer)\b/i.test(q)
}

function looksLikeSalesQuestion(q: string): boolean {
  return /\b(sales?|revenue|sold|orders?|refunds?|refund|buy|buys|exchange|exchanges|banking|variance|cash|till|today|yesterday|week|month|year|transactions?|top seller|best seller|earnings|turnover|profit|how much did we make)\b/i.test(q)
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return BigInt(d.getTime())
}

async function buildSnapshot(db: PrismaClient, settings: Obj) {
  const todayStart = startOfToday()
  const [productCount, inStockRows, lowStockRows, customerAgg, sales, topItem] = await Promise.all([
    db.product.count(),
    db.product.findMany({ select: { name: true, grade: true, stock: true } }),
    db.product.findMany({ select: { name: true, stock: true, lowStockThreshold: true } }),
    db.customer.aggregate({ _count: { _all: true }, _sum: { balance: true } }),
    db.sale.findMany({ select: { kind: true, total: true, createdAt: true } }),
    db.saleItem.groupBy({ by: ['productId'], _sum: { qty: true }, orderBy: { _sum: { qty: 'desc' } }, take: 1 }).catch(() => []),
  ])

  const catalog = inStockRows.map((p) => ({ name: p.name, grade: String(p.grade || ''), stock: p.stock }))
  const lowStock = lowStockRows
    .filter((r) => r.stock <= r.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 20)
    .map((p) => ({ name: p.name, stock: p.stock }))

  const sum = (rows: any[], kind?: string) => rows.filter((s) => !kind || s.kind === kind).reduce((a, s) => a + Math.abs(Number(s.total) || 0), 0)
  const count = (rows: any[], kind: string) => rows.filter((s) => s.kind === kind).length
  const todaySales = sales.filter((s) => BigInt(toNum(s.createdAt)) >= todayStart)
  const figures = { sales: sum(todaySales, 'sale'), buys: sum(todaySales, 'buy'), exchange: sum(todaySales, 'exchange'), refunds: sum(todaySales, 'refund'), orders: count(todaySales, 'sale') }
  const allFigures = { sales: sum(sales, 'sale'), buys: sum(sales, 'buy'), exchange: sum(sales, 'exchange'), refunds: sum(sales, 'refund'), orders: count(sales, 'sale') }

  let topProduct: string | undefined
  const top = (topItem as any[])[0]
  if (top?.productId) {
    const p = await db.product.findUnique({ where: { id: String(top.productId) }, select: { name: true } })
    topProduct = p?.name
  }

  return {
    storeName: String(settings.storeName || ''),
    currency: String(settings.currency || '$'),
    taxRate: Number(settings.taxRate) || 0,
    productCount,
    catalog,
    lowStock,
    todaySalesCount: figures.orders,
    todayFigures: figures,
    todayRevenue: figures.sales,
    totalSalesCount: allFigures.orders,
    totalRevenue: allFigures.sales,
    topProduct,
    customerCount: customerAgg._count._all,
    creditOutstanding: Number(customerAgg._sum.balance || 0),
  }
}

export async function buildAiContext(db: PrismaClient, req: AiContextRequest) {
  const question = String(req.question || '').trim().slice(0, 500)
  const attachedCustomerId = typeof req.attachedCustomerId === 'string' ? req.attachedCustomerId : null
  const tokens = tokenize(question).slice(0, 10)
  const customerQ = looksLikeCustomerQuestion(question) || !!attachedCustomerId
  const salesQ = looksLikeSalesQuestion(question)

  const settingsRow = await db.appSettings.findUnique({ where: { id: 'singleton' } })
  const settings = {
    storeName: String(settingsRow?.storeName ?? 'MEPoS'),
    currency: String(settingsRow?.currency ?? '$'),
    taxRate: Number(settingsRow?.taxRate ?? 0),
    aiEnabled: Boolean(settingsRow?.aiEnabled ?? true),
    kbEnabled: Boolean(settingsRow?.kbEnabled ?? true),
    skillsEnabled: Boolean(settingsRow?.skillsEnabled ?? true),
  }

  // For AI correctness, include full product/category catalog (capped). Scoped subsets caused hallucinations/misses.
  const [snapshot, categories, products, knowledge, skills, customers, salesRaw] = await Promise.all([
    buildSnapshot(db, settings),
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.product.findMany({ take: 2000, orderBy: [{ name: 'asc' }] }),
    settings.kbEnabled ? db.knowledgeDoc.findMany() : Promise.resolve([]),
    settings.skillsEnabled ? db.aiSkill.findMany() : Promise.resolve([]),
    customerQ
      ? db.customer.findMany({
          where: attachedCustomerId || tokens.length ? {
            OR: [
              ...(attachedCustomerId ? [{ id: attachedCustomerId }] : []),
              ...tokens.flatMap((t) => [
                { name: { contains: t, mode: 'insensitive' as const } },
                { email: { contains: t, mode: 'insensitive' as const } },
                { phone: { contains: t, mode: 'insensitive' as const } },
              ]),
            ],
          } : undefined,
          take: 100,
          orderBy: [{ name: 'asc' }],
        })
      : db.customer.findMany({ take: 200, orderBy: [{ name: 'asc' }] }),
    salesQ || customerQ
      ? db.sale.findMany({
          where: attachedCustomerId ? { customerId: attachedCustomerId } : undefined,
          include: { items: true },
          orderBy: [{ createdAt: 'desc' }],
          take: 500,
        })
      : db.sale.findMany({ include: { items: true }, orderBy: [{ createdAt: 'desc' }], take: 200 }),
  ])

  const mapSale = (s: any) => ({
    ...s,
    createdAt: toNum(s.createdAt),
    refundedAt: s.refundedAt != null ? toNum(s.refundedAt) : undefined,
    items: (s.items || []).map((it: any) => ({ productId: it.productId, name: it.name, price: it.price, qty: it.qty })),
  })

  return {
    settings,
    snapshot,
    products: products.map((p: any) => ({ ...p, createdAt: toNum(p.createdAt) })),
    categories,
    customers: customers.map((c: any) => ({ ...c, createdAt: toNum(c.createdAt) })),
    sales: salesRaw.map(mapSale),
    knowledge: knowledge.map((k: any) => ({ ...k, updatedAt: toNum(k.updatedAt) })),
    skills: skills.map((s: any) => ({ ...s, updatedAt: toNum(s.updatedAt) })),
    bankingContext: req.bankingContext ?? null,
  }
}
