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
  return /\b(customer|customers|client|buyer|purchase history|bought|spent|owe|credit|balance|loyalty|contact|email|phone)\b/i.test(q)
}

function looksLikeSalesQuestion(q: string): boolean {
  return /\b(sales?|revenue|sold|orders?|refunds?|buy|exchange|banking|variance|cash|till|today|yesterday|week|month|year|transactions?)\b/i.test(q)
}

function buildSnapshot(products: Obj[], sales: Obj[], customers: Obj[], settings: Obj) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const todayStart = start.getTime()
  const todaySales = sales.filter((s) => toNum(s.createdAt) >= todayStart)
  const sum = (rows: Obj[], kind?: string) =>
    rows.filter((s) => !kind || s.kind === kind).reduce((a, s) => a + Math.abs(Number(s.total) || 0), 0)
  const count = (rows: Obj[], kind: string) => rows.filter((s) => s.kind === kind).length
  const figures = {
    sales: sum(todaySales, 'sale'),
    buys: sum(todaySales, 'buy'),
    exchange: sum(todaySales, 'exchange'),
    refunds: sum(todaySales, 'refund'),
    orders: count(todaySales, 'sale'),
  }
  const allFigures = {
    sales: sum(sales, 'sale'),
    buys: sum(sales, 'buy'),
    exchange: sum(sales, 'exchange'),
    refunds: sum(sales, 'refund'),
    orders: count(sales, 'sale'),
  }
  const itemCounts = new Map<string, number>()
  for (const s of sales.filter((s) => s.kind === 'sale')) {
    for (const it of ((s.items as Obj[]) || [])) {
      const pid = String(it.productId || '')
      itemCounts.set(pid, (itemCounts.get(pid) ?? 0) + (Number(it.qty) || 0))
    }
  }
  const topId = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  return {
    storeName: String(settings.storeName || ''),
    currency: String(settings.currency || '$'),
    taxRate: Number(settings.taxRate) || 0,
    productCount: products.length,
    catalog: products.map((p) => ({ name: String(p.name || ''), grade: String(p.grade || ''), stock: Number(p.stock) || 0 })),
    lowStock: products
      .filter((p) => (Number(p.stock) || 0) <= (Number(p.lowStockThreshold) || 0))
      .map((p) => ({ name: String(p.name || ''), stock: Number(p.stock) || 0 }))
      .sort((a, b) => a.stock - b.stock),
    todaySalesCount: figures.orders,
    todayFigures: figures,
    todayRevenue: figures.sales,
    totalSalesCount: allFigures.orders,
    totalRevenue: allFigures.sales,
    topProduct: topId ? String(products.find((p) => String(p.id) === topId)?.name || '') || undefined : undefined,
    customerCount: customers.length,
    creditOutstanding: customers.reduce((s, c) => s + (Number(c.balance) || 0), 0),
  }
}

export async function buildAiContext(db: PrismaClient, req: AiContextRequest) {
  const question = String(req.question || '').trim().slice(0, 500)
  const attachedCustomerId = typeof req.attachedCustomerId === 'string' ? req.attachedCustomerId : null
  const tokens = tokenize(question).slice(0, 8)
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

  const productWhere = tokens.length
    ? { OR: tokens.flatMap((t) => [
        { name: { contains: t, mode: 'insensitive' as const } },
        { sku: { contains: t, mode: 'insensitive' as const } },
        { description: { contains: t, mode: 'insensitive' as const } },
      ]) }
    : undefined

  const [categories, products, knowledge, skills, customers, salesRaw] = await Promise.all([
    db.category.findMany(),
    db.product.findMany({ where: productWhere, take: 200, orderBy: [{ name: 'asc' }] }),
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
          take: 50,
          orderBy: [{ name: 'asc' }],
        })
      : Promise.resolve([]),
    salesQ || customerQ
      ? db.sale.findMany({
          where: attachedCustomerId ? { customerId: attachedCustomerId } : undefined,
          include: { items: true },
          orderBy: [{ createdAt: 'desc' }],
          take: customerQ ? 200 : 500,
        })
      : Promise.resolve([]),
  ])

  // For broad catalog questions with no token matches, provide a capped catalog sample.
  let finalProducts = products
  if (!finalProducts.length && !tokens.length) {
    finalProducts = await db.product.findMany({ take: 200, orderBy: [{ name: 'asc' }] })
  }
  if (!finalProducts.length && tokens.length) {
    // fallback: small sample so assistant can still say what's available
    finalProducts = await db.product.findMany({ take: 100, orderBy: [{ stock: 'desc' }, { name: 'asc' }] })
  }

  const mapSale = (s: any) => ({
    ...s,
    createdAt: toNum(s.createdAt),
    refundedAt: s.refundedAt != null ? toNum(s.refundedAt) : undefined,
    items: (s.items || []).map((it: any) => ({ productId: it.productId, name: it.name, price: it.price, qty: it.qty })),
  })

  const mappedProducts = finalProducts.map((p: any) => ({ ...p, createdAt: toNum(p.createdAt) }))
  const mappedCustomers = customers.map((c: any) => ({ ...c, createdAt: toNum(c.createdAt) }))
  const mappedSales = salesRaw.map(mapSale)
  const mappedKnowledge = knowledge.map((k: any) => ({ ...k, updatedAt: toNum(k.updatedAt) }))
  const mappedSkills = skills.map((s: any) => ({ ...s, updatedAt: toNum(s.updatedAt) }))

  const snapshot = buildSnapshot(mappedProducts as Obj[], mappedSales as Obj[], mappedCustomers as Obj[], settings as Obj)

  return {
    settings,
    snapshot,
    products: mappedProducts,
    categories,
    customers: mappedCustomers,
    sales: mappedSales,
    knowledge: mappedKnowledge,
    skills: mappedSkills,
    bankingContext: req.bankingContext ?? null,
  }
}
