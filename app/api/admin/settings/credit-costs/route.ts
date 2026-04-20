import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function adminOnly() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin' ? session : null
}

// PUT /api/admin/settings/credit-costs
export async function PUT(req: NextRequest) {
  if (!await adminOnly()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { costs } = await req.json()
  await Promise.all(costs.map((c: any) =>
    prisma.categoryCreditCost.upsert({
      where: { category: c.category },
      update: { cost: c.cost, updatedAt: new Date() },
      create: { category: c.category, cost: c.cost },
    })
  ))
  return NextResponse.json({ success: true })
}
