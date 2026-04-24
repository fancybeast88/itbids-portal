import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.stockItem.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const item = await prisma.stockItem.update({
    where: { id },
    data: {
      ...body,
      unitPricePkr: body.unitPricePkr ? BigInt(body.unitPricePkr) : undefined,
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
      updatedAt: new Date(),
    },
  })
  return NextResponse.json({ success: true })
}
