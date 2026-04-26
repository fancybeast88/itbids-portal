import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Delete related records first
  await prisma.rfqUnlock.deleteMany({ where: { rfqId: id } })
  await prisma.quote.deleteMany({ where: { rfqId: id } })
  await prisma.rfq.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
