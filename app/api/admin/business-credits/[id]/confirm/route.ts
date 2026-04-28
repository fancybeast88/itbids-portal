import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const txn = await prisma.businessCreditTransaction.findUnique({
    where: { id },
    include: { business: { include: { user: true } } },
  })
  if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (txn.status !== 'pending') {
    return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 })
  }
  if (txn.type !== 'purchase') {
    return NextResponse.json({ error: 'Only purchase transactions can be confirmed here' }, { status: 400 })
  }
  if (txn.credits <= 0) {
    return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.businessCreditTransaction.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'confirmed', confirmedAt: new Date() },
    })
    if (updated.count === 0) throw new Error('ALREADY_CONFIRMED')

    const biz = await tx.businessProfile.update({
      where: { id: txn.bizId },
      data: { credits: { increment: txn.credits } },
      select: { credits: true },
    })
    return { newBalance: biz.credits }
  }).catch((err) => {
    if (err?.message === 'ALREADY_CONFIRMED') return null
    throw err
  })

  if (!result) {
    return NextResponse.json({ error: 'Transaction was already confirmed' }, { status: 409 })
  }

  await sendEmail({
    to: txn.business.user.email,
    template: 'credits-added',
    data: { credits: txn.credits, balance: result.newBalance },
  }).catch(() => {})

  return NextResponse.json({ success: true, newBalance: result.newBalance })
}
