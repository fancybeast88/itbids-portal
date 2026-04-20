import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { transactionId } = await req.json();
  if (!transactionId) return NextResponse.json({ error: 'transactionId required' }, { status: 400 });

  const txn = await prisma.creditTransaction.findUnique({
    where: { id: transactionId },
    include: { vendor: { include: { user: true } } },
  });

  if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  if (txn.status !== 'pending') return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });

  await prisma.$transaction([
    prisma.creditTransaction.update({
      where: { id: transactionId },
      data: { status: 'confirmed', confirmedAt: new Date(), paymentMethod: 'bank_transfer' },
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

  return NextResponse.json({ success: true, newBalance });
}
