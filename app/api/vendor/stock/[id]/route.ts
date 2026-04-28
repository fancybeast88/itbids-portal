import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateStockItemSchema = z.object({
  type: z.enum(['available', 'upcoming']).optional(),
  brand: z.string().min(1).max(80).optional(),
  category: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  unitPricePkr: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  condition: z.string().max(50).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  expectedDate: z.union([
    z.string().datetime({ offset: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.null(),
  ]).optional(),
  isActive: z.boolean().optional(),
})

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id }, select: { id: true } })
  if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })

  const updated = await prisma.stockItem.updateMany({
    where: { id, vendorId: vendor.id },
    data: { isActive: false, updatedAt: new Date() },
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: (session.user as any).id }, select: { id: true } })
  if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })

  const parsed = UpdateStockItemSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid stock payload' },
      { status: 400 },
    )
  }
  const input = parsed.data

  const data: any = { updatedAt: new Date() }
  if (input.type !== undefined) data.type = input.type
  if (input.brand !== undefined) data.brand = input.brand
  if (input.category !== undefined) data.category = input.category
  if (input.model !== undefined) data.model = input.model
  if (input.description !== undefined) data.description = input.description
  if (input.quantity !== undefined) data.quantity = input.quantity
  if (input.unitPricePkr !== undefined) {
    data.unitPricePkr = typeof input.unitPricePkr === 'number' ? BigInt(input.unitPricePkr) : null
  }
  if (input.condition !== undefined) data.condition = input.condition ?? 'new'
  if (input.city !== undefined) data.city = input.city
  if (input.expectedDate !== undefined) {
    data.expectedDate = input.expectedDate ? new Date(input.expectedDate) : null
  }
  if (input.isActive !== undefined) data.isActive = input.isActive

  const updated = await prisma.stockItem.updateMany({
    where: { id, vendorId: vendor.id },
    data,
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
