import type { PrismaClient } from '@prisma/client'

const limit = 50

export async function searchStore(
  db: PrismaClient,
  query: string,
  customersOnly: boolean,
) {
  const match = {
    contains: query.replace(/[\\%_]/g, '\\$&'),
    mode: 'insensitive' as const,
  }
  const [products, people, sales] = await Promise.all([
    customersOnly
      ? []
      : db.product.findMany({
          where: {
            OR: [
              { name: match },
              { sku: match },
              { category: { name: match } },
              ...('general'.includes(query.toLowerCase())
                ? [{ categoryId: null }]
                : []),
            ],
          },
          select: {
            id: true,
            name: true,
            sku: true,
            category: { select: { name: true } },
            stock: true,
            price: true,
            cost: true,
            buyPrice: true,
            exchangePrice: true,
            requiresSerial: true,
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          take: limit + 1,
        }),
    db.customer.findMany({
      where: { OR: [{ name: match }, { email: match }, { phone: match }] },
      select: { id: true, name: true, email: true, phone: true, balance: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    }),
    customersOnly
      ? []
      : db.sale.findMany({
          where: {
            OR: [
              { receiptNo: match },
              { customer: { name: match } },
              ...('walk-in customer'.includes(query.toLowerCase())
                ? [{ customerId: null }]
                : []),
            ],
          },
          select: {
            id: true,
            receiptNo: true,
            customer: { select: { name: true } },
            createdAt: true,
            total: true,
            kind: true,
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          take: limit + 1,
        }),
  ])
  return {
    truncated: [products, people, sales].some((rows) => rows.length > limit),
    boxes: products.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      boxId: p.sku,
      category: p.category?.name ?? 'General',
      stockLevel: p.stock,
      sellPrice: p.price,
      buyPrice: p.buyPrice ?? Math.round(p.cost * 90) / 100,
      exchangePrice: p.exchangePrice ?? Math.round(p.price * 85) / 100,
      requiresSerial: p.requiresSerial,
      status: p.stock > 0 ? 'active' : 'discontinued',
    })),
    customers: people.slice(0, limit).map(({ balance, ...customer }) => ({
      ...customer,
      loyaltyPoints: Math.max(0, Math.round(balance)),
    })),
    orders: sales.slice(0, limit).map((s) => ({
      id: s.id,
      orderNumber: s.receiptNo,
      customer: s.customer?.name ?? 'Walk-in Customer',
      date: new Date(Number(s.createdAt)).toISOString(),
      total: Math.abs(s.total),
      type: s.kind === 'refund' ? 'sell' : s.kind,
    })),
  }
}
