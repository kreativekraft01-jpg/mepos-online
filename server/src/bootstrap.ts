import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'

export async function initializeStore(db: PrismaClient) {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(54671020)`
    if ((await tx.user.count()) === 0) {
      const username = process.env.ADMIN_USERNAME?.trim()
      const password = process.env.ADMIN_PASSWORD
      if (
        !username ||
        !password ||
        password.length < 12 ||
        Buffer.byteLength(password) > 72
      )
        throw new Error(
          'First startup requires ADMIN_USERNAME and ADMIN_PASSWORD (at least 12 characters and at most 72 UTF-8 bytes).',
        )
      await tx.user.create({
        data: { username, passwordHash: await bcrypt.hash(password, 12) },
      })
    }
    if ((await tx.till.count()) === 0)
      await tx.till.create({
        data: {
          id: 'front',
          name: 'Front till',
          status: 'open',
          openedAt: BigInt(Date.now()),
          openingFloat: 0,
        },
      })
    await tx.appSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        storeName: 'MEPoS',
        tagline: '',
        currency: process.env.STORE_CURRENCY || '$',
        taxRate: 0,
        receiptFooter: '',
        aiEnabled: true,
        browserModel: '',
        kbEnabled: true,
        skillsEnabled: true,
        aiDataSource: 'snapshot',
        activeTillId: 'front',
      },
    })
  })
}
