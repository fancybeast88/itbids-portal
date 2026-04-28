import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJazzCashCallback } from '@/lib/jazzcash';
import { sendEmail } from '@/lib/email';

async function handleCallback(req: NextRequest, params: Record<string, string>) {
  if (!verifyJazzCashCallback({ ...params })) {
    console.error('JazzCash: invalid signature');
    return NextResponse.redirect(new URL('/vendor/credits?status=failed', req.url));
  }

  const responseCode = params.pp_ResponseCode;
  const txnRef       = params.pp_TxnRefNo;

  if (responseCode === '000') {
    const txn = await prisma.creditTransaction.findFirst({
      where: { paymentRef: txnRef, status: 'pending', type: 'purchase' },
      include: { vendor: { include: { user: true } } },
    });

    if (txn && txn.credits > 0) {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.creditTransaction.updateMany({
          where: { id: txn.id, status: 'pending' },
          data: { status: 'confirmed', confirmedAt: new Date(), paymentMethod: 'jazzcash' },
        });
        if (updated.count === 0) return null;

        const vendor = await tx.vendorProfile.update({
          where: { id: txn.vendorId },
          data:  { credits: { increment: txn.credits } },
          select: { credits: true },
        });
        return { newBalance: vendor.credits };
      });

      if (result) {
        await sendEmail({
          to:       txn.vendor.user.email,
          template: 'credits-added',
          data:     { credits: txn.credits, balance: result.newBalance },
        }).catch(() => {});
      }
    }

    return NextResponse.redirect(new URL('/vendor/credits?status=success', req.url));
  }

  await prisma.creditTransaction.updateMany({
    where: { paymentRef: txnRef, status: 'pending' },
    data:  { status: 'failed' },
  });
  return NextResponse.redirect(new URL('/vendor/credits?status=failed', req.url));
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((val, key) => { params[key] = val.toString(); });
  return handleCallback(req, params);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => { params[key] = val; });
  return handleCallback(req, params);
}
