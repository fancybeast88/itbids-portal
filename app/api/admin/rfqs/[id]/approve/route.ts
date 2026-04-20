import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rfq = await prisma.rfq.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date(), approvedById: session.user.id },
    include: { business: { include: { user: true } } },
  })
  await sendEmail({ to: rfq.business.user.email, template: 'rfq-approved', data: { rfqTitle: rfq.title } })
  return NextResponse.json({ success: true })
}
