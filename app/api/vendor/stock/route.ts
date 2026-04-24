import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const where: any = { isActive: true }
  if (type) where.type = type
  if (user.role === 'vendor') {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } })
    if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    where.vendorId = vendor.id
  }
  const items = await prisma.stockItem.findMany({
    where,
    include: { vendor: { select: { companyName: true, city: true, phone: true, partnerLevel: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(items.map(i => ({ ...i, unitPricePkr: i.unitPricePkr?.toString() })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { type, brand, category, model, description, quantity, unitPricePkr, condition, city, expectedDate } = await req.json()
  if (!brand || !category || !model || !quantity) {
    return NextResponse.json({ error: 'Brand, category, model and quantity are required' }, { status: 400 })
  }
  const item = await prisma.stockItem.create({
    data: {
      vendorId: vendor.id,
      type: type || 'available',
      brand, category, model,
      description: description || null,
      quantity: Number(quantity),
      unitPricePkr: unitPricePkr ? BigInt(unitPricePkr) : null,
      condition: condition || 'new',
      city: city || vendor.city || null,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
    },
  })
  return NextResponse.json({ success: true, id: item.id })
}
