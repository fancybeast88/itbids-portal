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
  const existing = await prisma.rfqUnlock.findUnique({ where: { rfqId_vendorId: { rfqId: rfq.id, vendorId: vendor.id } } })
  if (existing) return NextResponse.json({ error: 'Already unlocked' }, { status: 400 })
  if (vendor.credits < rfq.creditCost) return NextResponse.json({ error: `Need ${rfq.creditCost} credits, have ${vendor.credits}.` }, { status: 402 })
  await prisma.$transaction([
    prisma.vendorProfile.update({ where: { id: vendor.id }, data: { credits: { decrement: rfq.creditCost } } }),
    prisma.rfqUnlock.create({ data: { rfqId: rfq.id, vendorId: vendor.id, creditsUsed: rfq.creditCost } }),
    prisma.creditTransaction.create({ data: { vendorId: vendor.id, type: 'unlock', credits: -rfq.creditCost, status: 'confirmed' } }),
    prisma.notification.create({ data: { userId: session.user.id, type: 'rfq-unlocked', title: 'RFQ unlocked', body: `You unlocked "${rfq.title}" for ${rfq.creditCost} credits.` } }),
  ])
  await sendEmail({ to: session.user.email!, template: 'rfq-unlocked', data: { rfqTitle: rfq.title, creditsUsed: rfq.creditCost, rfqId: rfq.id } })
  return NextResponse.json({ success: true, newBalance: vendor.credits - rfq.creditCost })
}
