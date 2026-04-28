import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'business') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const biz = await prisma.businessProfile.findUnique({
    where: { userId: (session.user as any).id },
  })
  if (!biz) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { packageId, method } = await req.json()
  if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })

  const allowedMethods = ['bank_transfer', 'jazzcash', 'easypaisa']
  const paymentMethod = method === 'bank' ? 'bank_transfer' : method
  if (!allowedMethods.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  }

  const pkg = await prisma.creditPackage.findUnique({ where: { id: packageId } })
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const txnRef = `ITB-BIZ-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  const txn = await prisma.businessCreditTransaction.create({
    data: {
      bizId: biz.id,
      type: 'purchase',
      credits: pkg.credits,
      amountPkr: pkg.pricePkr,
      paymentMethod,
      paymentRef: txnRef,
      status: 'pending',
    },
  })

  if (paymentMethod === 'bank_transfer') {
    return NextResponse.json({
      success: true,
      txnId: txn.id,
      txnRef,
      amount: pkg.pricePkr,
      bankDetails: {
        bankName: 'HBL',
        accountTitle: 'IT Bids Portal (Pvt) Ltd',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || '0123-456789-01',
        branch: 'Karachi Main Branch',
        reference: txnRef,
      },
      message: 'Transfer the amount and ask admin to confirm with reference ' + txnRef,
    })
  }

  return NextResponse.json({
    success: true,
    txnId: txn.id,
    txnRef,
    amount: pkg.pricePkr,
    message: 'Complete the payment in your wallet app, then ask admin to confirm.',
  })
}
