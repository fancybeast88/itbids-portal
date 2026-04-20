import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateJazzCashRequest } from '@/lib/jazzcash';
import crypto from 'crypto';

const PACKAGES: Record<number, number> = {
  50:  500,
  100: 1000,
  250: 2200,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (user.role !== 'vendor') return NextResponse.json({ error: 'Only vendors can buy credits' }, { status: 403 });

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });

  const { credits, method, mobileNo, slipUrl } = await req.json();

  if (!PACKAGES[credits]) {
    return NextResponse.json({ error: 'Invalid credit package' }, { status: 400 });
  }
  const amountPkr = PACKAGES[credits];

  const txnRef = `ITB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Create a pending transaction
  const txn = await prisma.creditTransaction.create({
    data: {
      vendorId:      vendor.id,
      type:          'purchase',
      credits,
      amountPkr,
      paymentMethod: method,
      paymentRef:    txnRef,
      
      status: 'pending',
    },
  });

  if (method === 'jazzcash') {
    if (!mobileNo) return NextResponse.json({ error: 'Mobile number required for JazzCash' }, { status: 400 });
    const params = generateJazzCashRequest(amountPkr, txnRef, mobileNo);
    return NextResponse.json({ method: 'jazzcash', params, txnId: txn.id });
  }

  if (method === 'easypaisa') {
    if (!mobileNo) return NextResponse.json({ error: 'Mobile number required for Easypaisa' }, { status: 400 });
    return NextResponse.json({
      method:  'easypaisa',
      txnId:   txn.id,
      txnRef,
      amount:  amountPkr,
      message: 'Please complete payment in your Easypaisa app.',
    });
  }

  if (method === 'bank_transfer') {
    return NextResponse.json({
      method:  'bank_transfer',
      txnId:   txn.id,
      txnRef,
      amount:  amountPkr,
      bankDetails: {
        bankName:      'HBL',
        accountTitle:  'IT Bids Portal (Pvt) Ltd',
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || '0123-456789-01',
        branch:        'Karachi Main Branch',
        reference:     txnRef,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
}
