import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const creditCost = Number(body.creditCost)
    if (!Number.isFinite(creditCost) || !Number.isInteger(creditCost)) {
      return NextResponse.json({ error: 'Invalid credit cost' }, { status: 400 })
    }
    if (creditCost < 1 || creditCost > 20) {
      return NextResponse.json({ error: 'Credit cost must be between 1 and 20' }, { status: 400 })
    }
    await prisma.rfq.update({ where: { id }, data: { creditCost } })
    return NextResponse.json({ success: true, creditCost })
  } catch (err: any) {
    console.error('credit-cost error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
