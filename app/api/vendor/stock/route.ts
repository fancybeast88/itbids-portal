import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { apiError } from '@/lib/api'

const CreateStockItemSchema = z.object({
  type: z.enum(['available', 'upcoming']).optional(),
  brand: z.string().min(1).max(80),
  category: z.string().min(1).max(80),
  model: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  quantity: z.coerce.number().int().positive(),
  unitPricePkr: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  condition: z.string().max(50).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  expectedDate: z.union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return apiError('Unauthorized', 401)
    const user = session.user as any
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const where: any = { isActive: true }
    if (type) where.type = type
    if (user.role === 'vendor') {
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } })
      if (!vendor) return apiError('Not found', 404)
      where.vendorId = vendor.id
    }
    const items = await prisma.stockItem.findMany({
      where,
      include: { vendor: { select: { companyName: true, city: true, phone: true, partnerLevel: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items.map(i => ({ ...i, unitPricePkr: i.unitPricePkr?.toString() })))
  } catch {
    return apiError('Failed to load stock', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'vendor') return apiError('Forbidden', 403)
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id } })
    if (!vendor) return apiError('Not found', 404)

    const parsed = CreateStockItemSchema.safeParse(await req.json())
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid stock payload', 400)
    const { type, brand, category, model, description, quantity, unitPricePkr, condition, city, expectedDate } = parsed.data

    const item = await prisma.stockItem.create({
      data: {
        vendorId: vendor.id,
        type: type || 'available',
        brand, category, model,
        description: description || null,
        quantity: Number(quantity),
        unitPricePkr: typeof unitPricePkr === 'number' ? BigInt(unitPricePkr) : null,
        condition: condition || 'new',
        city: city || vendor.city || null,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
      },
    })
    return NextResponse.json({ success: true, id: item.id })
  } catch {
    return apiError('Failed to create stock item', 500)
  }
}
