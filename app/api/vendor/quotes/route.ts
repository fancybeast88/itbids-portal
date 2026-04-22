import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const quotes = await prisma.quote.findMany({
    where: { vendorId: vendor.id },
    include: { rfq: { include: { business: { select: { companyName: true, city: true, phone: true } } } } },
    orderBy: { submittedAt: 'desc' },
  })

  return NextResponse.json({
    quotes: quotes.map(q => ({ ...q, totalAmount: q.totalAmount.toString() })),
    credits: vendor.credits,
  })
}
