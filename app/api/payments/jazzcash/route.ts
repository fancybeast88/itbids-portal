import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJazzCashCallback } from '@/lib/jazzcash';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((val, key) => { params[key] = val.toString(); });

  if (!verifyJazzCashCallback({ ...params })) {
    console.error('JazzCash: invalid signature');
    return NextResponse.redirect(new URL('/vendor/credits?status=failed', req.url));
  }

  const responseCode = params.pp_ResponseCode;
  const txnRef       = params.pp_TxnRefNo;

  if (responseCode === '000') {
    const txn = await prisma.creditTransaction.findFirst({
      where: { paymentRef: txnRef, status: 'pending' },
      include: { vendor: { include: { user: true } } },
    });

    if (txn) {
      await prisma.$transaction([
        prisma.creditTransaction.update({
          where: { id: txn.id },
          data: { status: 'confirmed', confirmedAt: new Date(), paymentMethod: 'jazzcash' },
        }),
        prisma.vendorProfile.update({
          where: { id: txn.vendorId },
          data:  { credits: { increment: txn.credits } },
        }),
      ]);

      const newBalance = txn.vendor.credits + txn.credits;
      await sendEmail({
        to:       txn.vendor.user.email,
        template: 'credits-added',
        data:     { credits: txn.credits, balance: newBalance },
      });
    }

    return NextResponse.redirect(new URL('/vendor/credits?status=success', req.url));
  }

  await prisma.creditTransaction.updateMany({
    where: { paymentRef: txnRef },
    data:  { status: 'FAILED' },
  });
  return NextResponse.redirect(new URL('/vendor/credits?status=failed', req.url));
}
