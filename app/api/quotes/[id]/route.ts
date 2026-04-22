import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role !== 'business' && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json()
  const allowed = ['shortlisted', 'won', 'lost']
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const quote = await prisma.quote.update({
    where: { id },
    data: { status },
    include: { vendor: { include: { user: true } }, rfq: true },
  })

  if (status === 'shortlisted') {
    await sendEmail({ to: quote.vendor.user.email, template: 'quote-shortlisted', data: { rfqTitle: quote.rfq.title } }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
