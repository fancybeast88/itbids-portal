import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const biz = await prisma.businessProfile.findUnique({ where: { userId: (session.user as any).id } })
  if (!biz) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { packageId, method, mobile } = await req.json()
  const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } })
  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  const txnRef = `LV-BIZ-${Date.now()}-${biz.id.slice(0, 6)}`

  await prisma.businessCreditTransaction.create({
    data: { bizId: biz.id, type: 'purchase', credits: pkg.credits, status: 'pending' },
  })

  if (method === 'bank' || method === 'bank_transfer') {
    return NextResponse.json({ success: true, txnRef, message: 'Transfer to account and wait for admin confirmation' })
  }

  return NextResponse.json({ success: true, txnRef })
}
