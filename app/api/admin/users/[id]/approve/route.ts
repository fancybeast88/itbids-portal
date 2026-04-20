import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const user = await prisma.user.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date(), approvedById: session.user.id },
    include: { vendorProfile: true, businessProfile: true },
  })
  const companyName = user.vendorProfile?.companyName || user.businessProfile?.companyName || 'Your company'
  await sendEmail({ to: user.email, template: 'account-approved', data: { companyName } })
  return NextResponse.json({ success: true })
}
