import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
  const rfq = await prisma.rfq.findUnique({ where: { id } })
  if (!rfq || rfq.status !== 'approved') return NextResponse.json({ error: 'RFQ not available' }, { status: 400 })
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rfqUnlock.findUnique({
        where: { rfqId_vendorId: { rfqId: rfq.id, vendorId: vendor.id } },
      })
      if (existing) {
        throw new Error('ALREADY_UNLOCKED')
      }

      const decrement = await tx.vendorProfile.updateMany({
        where: { id: vendor.id, credits: { gte: rfq.creditCost } },
        data: { credits: { decrement: rfq.creditCost } },
      })
      if (decrement.count === 0) {
        throw new Error('INSUFFICIENT_CREDITS')
      }

      await tx.rfqUnlock.create({
        data: { rfqId: rfq.id, vendorId: vendor.id, creditsUsed: rfq.creditCost },
      })
      await tx.creditTransaction.create({
        data: { vendorId: vendor.id, type: 'unlock', credits: -rfq.creditCost, status: 'confirmed' },
      })
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: 'rfq-unlocked',
          title: 'RFQ unlocked',
          body: `You unlocked "${rfq.title}" for ${rfq.creditCost} credits.`,
        },
      })

      const updatedVendor = await tx.vendorProfile.findUnique({
        where: { id: vendor.id },
        select: { credits: true },
      })
      return { credits: updatedVendor?.credits ?? 0 }
    })

    await sendEmail({
      to: session.user.email!,
      template: 'rfq-unlocked',
      data: { rfqTitle: rfq.title, creditsUsed: rfq.creditCost, rfqId: rfq.id },
    }).catch(() => {})

    return NextResponse.json({ success: true, newBalance: result.credits })
  } catch (error: any) {
    if (error?.message === 'ALREADY_UNLOCKED') {
      return NextResponse.json({ error: 'Already unlocked' }, { status: 400 })
    }
    if (error?.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: `Need ${rfq.creditCost} credits to unlock this RFQ.` }, { status: 402 })
    }
    return NextResponse.json({ error: 'Failed to unlock RFQ' }, { status: 500 })
  }
}
