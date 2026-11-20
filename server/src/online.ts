import { createHash, randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

class InvalidSale extends Error {}
type Line = { id: string; qty: number; cents: number }
type Checkout = {
  requestId: string
  till: string
  customer: string | null
  lines: Line[]
}

function parseCheckout(body: any): Checkout {
  if (
    !body ||
    !/^[a-f0-9-]{36}$/i.test(body.requestId ?? '') ||
    typeof body.till !== 'string' ||
    !body.till ||
    body.till.length > 128 ||
    (body.customer != null && typeof body.customer !== 'string') ||
    !Array.isArray(body.lines) ||
    !body.lines.length ||
    body.lines.length > 100
  ) {
    throw new InvalidSale('Invalid checkout.')
  }
  const seen = new Set<string>()
  const lines = body.lines.map((line: Line) => {
    if (
      !line ||
      typeof line.id !== 'string' ||
      !line.id ||
      seen.has(line.id) ||
      !Number.isSafeInteger(line.qty) ||
      line.qty < 1 ||
      line.qty > 999 ||
      !Number.isSafeInteger(line.cents) ||
      line.cents < 0
    )
      throw new InvalidSale('Invalid cart line.')
    seen.add(line.id)
    return { id: line.id, qty: line.qty, cents: line.cents }
  })
  return {
    requestId: body.requestId,
    till: body.till,
    customer: body.customer ?? null,
    lines,
  }
}

export function onlineApi(db: () => PrismaClient) {
  const api = Router()
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  api.get('/summary', async (_req, res, next) => {
    try {
      const [products, customers, sales, tills, settings] = await Promise.all([
        db().product.count(),
        db().customer.count(),
        db().sale.count(),
        db().till.findMany({
          where: { status: 'open' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        db().appSettings.findUnique({
          where: { id: 'singleton' },
          select: { currency: true },
        }),
      ])
      res.json({
        products,
        customers,
        sales,
        tills,
        currency: settings?.currency ?? '$',
      })
    } catch (e) {
      next(e)
    }
  })
  api.post('/records', async (req, res, next) => {
    const body = req.body ?? {}
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name || name.length > 200)
      return res
        .status(400)
        .json({ error: 'Enter a name of up to 200 characters.' })
    const common = { id: randomUUID(), name, createdAt: BigInt(Date.now()) }
    try {
      if (body.kind === 'customers') {
        if (
          typeof body.email !== 'string' ||
          body.email.length > 254 ||
          typeof body.phone !== 'string' ||
          body.phone.length > 40
        )
          return res.status(400).json({ error: 'Invalid contact details.' })
        await db().customer.create({
          data: {
            ...common,
            email: body.email.trim(),
            phone: body.phone.trim(),
            balance: 0,
            notes: '',
          },
        })
      } else if (body.kind === 'products') {
        const sku = typeof body.sku === 'string' ? body.sku.trim() : ''
        if (
          !sku ||
          sku.length > 100 ||
          !Number.isSafeInteger(body.cents) ||
          body.cents < 0 ||
          body.cents > 999999999 ||
          !Number.isInteger(body.stock) ||
          body.stock < 0 ||
          body.stock > 2147483647
        )
          return res
            .status(400)
            .json({
              error: 'Check the SKU, price and whole-number stock quantity.',
            })
        await db().product.create({
          data: {
            ...common,
            sku,
            price: body.cents / 100,
            stock: body.stock,
            description: '',
            grade: '',
            cost: 0,
            lowStockThreshold: 0,
            image: '',
          },
        })
      } else return res.status(400).json({ error: 'Unknown record type.' })
      res.status(201).json({ id: common.id })
    } catch (e) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        e.code === 'P2002'
      )
        return res.status(409).json({ error: 'This SKU already exists.' })
      next(e)
    }
  })
  api.post('/directory', async (req, res, next) => {
    const { kind, term, page } = req.body ?? {}
    if (
      !['products', 'customers'].includes(kind) ||
      typeof term !== 'string' ||
      term.length > 200 ||
      !Number.isSafeInteger(page) ||
      page < 0 ||
      page > 100000
    ) {
      return res.status(400).json({ error: 'Invalid search.' })
    }
    const match = {
      contains: term.trim().replace(/[\\%_]/g, '\\$&'),
      mode: 'insensitive' as const,
    }
    const paging = {
      skip: page * 25,
      take: 26,
      orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }],
    }
    try {
      const rows =
        kind === 'products'
          ? await db().product.findMany({
              ...paging,
              where: {
                OR: [
                  { name: match },
                  { sku: match },
                  { category: { name: match } },
                ],
              },
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stock: true,
                requiresSerial: true,
              },
            })
          : await db().customer.findMany({
              ...paging,
              where: {
                OR: [{ name: match }, { email: match }, { phone: match }],
              },
              select: { id: true, name: true, email: true, phone: true },
            })
      res.json({ rows: rows.slice(0, 25), more: rows.length > 25 })
    } catch (e) {
      next(e)
    }
  })
  api.post('/checkout', async (req, res, next) => {
    try {
      const input = parseCheckout(req.body)
      const user = (req as typeof req & { user: { id: string } }).user
      const fingerprint = createHash('sha256')
        .update(JSON.stringify([user.id, input]))
        .digest('hex')
      const saleId = 'online-' + input.requestId
      const receipt = await db().$transaction(
        async (tx) => {
          // Serialize receipt-number allocation and retries across all online service instances.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(54671023)`
          const previous = await tx.sale.findUnique({ where: { id: saleId } })
          if (previous) {
            const first = Array.isArray(previous.payments)
              ? previous.payments[0]
              : null
            if (
              !first ||
              typeof first !== 'object' ||
              Array.isArray(first) ||
              first.requestFingerprint !== fingerprint
            )
              throw new InvalidSale(
                'This checkout ID was already used for a different cart.',
              )
            return { receiptNo: previous.receiptNo, total: previous.total }
          }
          const till = await tx.till.findUnique({ where: { id: input.till } })
          if (till?.status !== 'open')
            throw new InvalidSale('Select an open till.')
          if (
            input.customer &&
            !(await tx.customer.findUnique({
              where: { id: input.customer },
              select: { id: true },
            }))
          )
            throw new InvalidSale('Customer no longer exists.')
          const items = []
          let totalCents = 0
          for (const line of input.lines) {
            const p = await tx.product.findUnique({ where: { id: line.id } })
            if (!p || p.requiresSerial)
              throw new InvalidSale('Product unavailable for this checkout.')
            const cents = Math.round(p.price * 100)
            if (cents !== line.cents)
              throw new InvalidSale(
                'Price changed. Reopen the cart with current prices.',
              )
            const changed = await tx.product.updateMany({
              where: {
                id: p.id,
                stock: { gte: line.qty },
                price: p.price,
                requiresSerial: false,
              },
              data: { stock: { decrement: line.qty } },
            })
            if (!changed.count)
              throw new InvalidSale(
                'Stock or price changed. Refresh your search.',
              )
            totalCents += cents * line.qty
            if (!Number.isSafeInteger(totalCents))
              throw new InvalidSale('Invalid total.')
            items.push({
              productId: p.id,
              name: p.name,
              price: cents / 100,
              qty: line.qty,
            })
          }
          // Match the existing POS policy: displayed sell prices are the checkout totals.
          const total = totalCents / 100
          const [sequence] = await tx.$queryRaw<{ next: string }[]>`
          SELECT (GREATEST(COALESCE(MAX("receiptNo"::numeric),1000),1000)+1)::text AS next
          FROM "Sale" WHERE "receiptNo" ~ '^[0-9]+$'`
          return tx.sale.create({
            data: {
              id: saleId,
              receiptNo: sequence.next,
              subtotal: total,
              total,
              taxAmount: 0,
              taxRate: 0,
              discount: 0,
              kind: 'sale',
              paymentMethod: 'cash',
              cashReceived: total,
              changeDue: 0,
              payments: [
                {
                  method: 'cash',
                  amount: total,
                  requestFingerprint: fingerprint,
                },
              ],
              tillId: input.till,
              customerId: input.customer,
              createdAt: BigInt(Date.now()),
              items: { create: items },
            },
            select: { receiptNo: true, total: true },
          })
        },
        { timeout: 15000 },
      )
      res.json(receipt)
    } catch (e) {
      if (e instanceof InvalidSale)
        return res.status(409).json({ error: e.message })
      next(e)
    }
  })
  api.use(
    (
      err: Error,
      _req: import('express').Request,
      res: import('express').Response,
      _next: import('express').NextFunction,
    ) => {
      console.error('[online]', err.name)
      res
        .status(503)
        .json({ error: 'Database unavailable. Retry when connected.' })
    },
  )
  return api
}
