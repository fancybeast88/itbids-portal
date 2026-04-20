import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { reason } = await req.json().catch(() => ({}))
  const rfq = await prisma.rfq.update({
    where: { id },
    data: { status: 'rejected' },
    include: { business: { include: { user: true } } },
  })
  await sendEmail({ to: rfq.business.user.email, template: 'rfq-rejected', data: { rfqTitle: rfq.title, reason } })
  return NextResponse.json({ success: true })
}
