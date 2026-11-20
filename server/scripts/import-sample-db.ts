/**
 * One-off importer for the local `sample db/` snapshot.
 *
 * Safe by default: only tables that are empty are seeded. Nothing is deleted
 * or overwritten. Run with --dry-run to inspect the plan without connecting
 * to the database.
 *
 *   npx tsx scripts/import-sample-db.ts --dry-run
 *   DIRECT_URL='postgresql://...' npx tsx scripts/import-sample-db.ts --apply
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeState, toTableRows } from '../src/state.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const sampleDir = path.resolve(here, '../../sample db')
const apply = process.argv.includes('--apply')
const dryRun = !apply

function readSnapshot() {
  const file = path.join(sampleDir, 'StoreState.json')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw) || !raw[0]?.data) throw new Error('StoreState.json is missing its data object')
  return raw[0].data
}

function checkDuplicates(rows: any[], key: string, label: string) {
  const seen = new Set<string>()
  for (const row of rows) {
    const value = String(row[key] ?? '')
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`)
    seen.add(value)
  }
}

function summarize(label: string, count: number, willInsert: boolean) {
  console.log(`  ${label.padEnd(16)} ${String(count).padStart(4)} rows  ${willInsert ? 'SEED' : 'skip (not empty)'}`)
}

async function main() {
  const snapshot = readSnapshot()
  const state = normalizeState(snapshot)
  const rows = toTableRows(state)

  // The snapshot stores sale items on each sale; SaleItem.json is the same data
  // in table form. Use the normalized sale items so IDs are not required.
  const items = rows.sales.flatMap((sale: any) =>
    (sale.items ?? []).map((item: any) => ({ ...item, id: undefined, saleId: sale.id })),
  )

  checkDuplicates(rows.categories, 'id', 'category id')
  checkDuplicates(rows.products, 'id', 'product id')
  checkDuplicates(rows.products, 'sku', 'product sku')
  checkDuplicates(rows.customers, 'id', 'customer id')
  checkDuplicates(rows.sales, 'id', 'sale id')
  checkDuplicates(rows.sales, 'receiptNo', 'receipt number')
  checkDuplicates(rows.vouchers, 'id', 'voucher id')
  checkDuplicates(rows.vouchers, 'code', 'voucher code')
  checkDuplicates(rows.knowledge, 'id', 'knowledge id')
  checkDuplicates(rows.skills, 'id', 'skill id')
  checkDuplicates(rows.tills, 'id', 'till id')
  checkDuplicates(rows.savedCarts, 'id', 'saved cart id')

  const categoryIds = new Set(rows.categories.map((c: any) => c.id))
  const customerIds = new Set(rows.customers.map((c: any) => c.id))
  const saleIds = new Set(rows.sales.map((s: any) => s.id))

  const danglingCategories = rows.products.filter((p: any) => p.categoryId && !categoryIds.has(p.categoryId)).length
  const danglingCustomers = rows.sales.filter((s: any) => s.customerId && !customerIds.has(s.customerId)).length
  const danglingItems = items.filter((i: any) => !saleIds.has(i.saleId)).length
  if (danglingCategories || danglingCustomers || danglingItems) {
    console.log('Note: dropping dangling references before insert:', {
      productsWithUnknownCategory: danglingCategories,
      salesWithUnknownCustomer: danglingCustomers,
      itemsWithUnknownSale: danglingItems,
    })
  }
  for (const product of rows.products) {
    if (product.categoryId && !categoryIds.has(product.categoryId)) product.categoryId = null
  }
  for (const sale of rows.sales) {
    if (sale.customerId && !customerIds.has(sale.customerId)) sale.customerId = null
  }
  const cleanItems = items.filter((i: any) => saleIds.has(i.saleId))

  const tables = [
    ['Category', rows.categories.length],
    ['Product', rows.products.length],
    ['Customer', rows.customers.length],
    ['Sale', rows.sales.length],
    ['SaleItem', cleanItems.length],
    ['GiftVoucher', rows.vouchers.length],
    ['KnowledgeDoc', rows.knowledge.length],
    ['AiSkill', rows.skills.length],
    ['Till', rows.tills.length],
    ['SavedCart', rows.savedCarts.length],
    ['AppSettings', rows.settings ? 1 : 0],
    ['StoreState', 1],
  ] as const

  console.log(`Sample snapshot: ${path.join(sampleDir, 'StoreState.json')}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (no database writes)' : 'APPLY (empty tables only)'}`)
  console.log('Planned rows:')
  for (const [name, count] of tables) summarize(name, count, true)

  if (dryRun) {
    console.log('\nDry run complete. Re-run with --apply and DIRECT_URL set to write to Neon.')
    return
  }

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!url) throw new Error('Set DIRECT_URL (preferred) or DATABASE_URL before --apply.')
  const masked = url.replace(/\/\/([^:]+):[^@]+@/, '//$1:***@')
  console.log(`\nConnecting to ${masked}`)

  const { PrismaClient } = await import('@prisma/client')
  const db = new PrismaClient({ datasources: { db: { url } } })
  try {
    await db.$connect()
    await db.$transaction(async (tx: any) => {
      const counts = {
        categories: await tx.category.count(),
        products: await tx.product.count(),
        customers: await tx.customer.count(),
        sales: await tx.sale.count(),
        vouchers: await tx.giftVoucher.count(),
        knowledge: await tx.knowledgeDoc.count(),
        skills: await tx.aiSkill.count(),
        tills: await tx.till.count(),
        carts: await tx.savedCart.count(),
        settings: await tx.appSettings.count(),
        storeState: await tx.storeState.count(),
      }
      console.log('Existing rows found:')
      summarize('Category', counts.categories, counts.categories === 0)
      summarize('Product', counts.products, counts.products === 0)
      summarize('Customer', counts.customers, counts.customers === 0)
      summarize('Sale', counts.sales, counts.sales === 0)
      summarize('GiftVoucher', counts.vouchers, counts.vouchers === 0)
      summarize('KnowledgeDoc', counts.knowledge, counts.knowledge === 0)
      summarize('AiSkill', counts.skills, counts.skills === 0)
      summarize('Till', counts.tills, counts.tills === 0)
      summarize('SavedCart', counts.carts, counts.carts === 0)
      summarize('AppSettings', counts.settings, counts.settings === 0)
      summarize('StoreState', counts.storeState, counts.storeState === 0)

      if (counts.categories === 0 && rows.categories.length) await tx.category.createMany({ data: rows.categories })
      // If categories already exist, keep products but drop references to sample categories that are absent.
      const productRows = counts.categories === 0 ? rows.products : rows.products.map((p: any) => ({ ...p, categoryId: null }))
      if (counts.products === 0 && productRows.length) await tx.product.createMany({ data: productRows, skipDuplicates: true })

      if (counts.customers === 0 && rows.customers.length) await tx.customer.createMany({ data: rows.customers })
      const saleRows = counts.customers === 0 ? rows.sales : rows.sales.map((s: any) => ({ ...s, customerId: null }))
      if (counts.sales === 0 && saleRows.length) await tx.sale.createMany({ data: saleRows.map(({ items: _items, ...sale }: any) => sale), skipDuplicates: true })
      if (counts.sales === 0 && cleanItems.length) {
        await tx.saleItem.createMany({ data: cleanItems.map(({ id: _id, ...item }: any) => item), skipDuplicates: true })
      }

      if (counts.vouchers === 0 && rows.vouchers.length) await tx.giftVoucher.createMany({ data: rows.vouchers })
      if (counts.knowledge === 0 && rows.knowledge.length) await tx.knowledgeDoc.createMany({ data: rows.knowledge })
      if (counts.skills === 0 && rows.skills.length) await tx.aiSkill.createMany({ data: rows.skills })
      if (counts.tills === 0 && rows.tills.length) await tx.till.createMany({ data: rows.tills })
      if (counts.carts === 0 && rows.savedCarts.length) await tx.savedCart.createMany({ data: rows.savedCarts })
      if (counts.settings === 0 && rows.settings) {
        await tx.appSettings.create({ data: { id: 'singleton', ...rows.settings } })
      }
      if (counts.storeState === 0) {
        await tx.storeState.create({ data: { id: 'singleton', data: state as any } })
      }
    }, { timeout: 120000 })
    console.log('\nImport finished. Existing rows were left untouched.')
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
