import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET /api/quotes — vendor gets their quotes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  if (user.role === 'vendor') {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
    if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const quotes = await prisma.quote.findMany({
      where:   { vendorId: vendor.id },
      orderBy: { submittedAt: 'desc' },
      include: { rfq: { select: { title: true, brand: true } } },
    });
    return NextResponse.json(quotes.map((q: any) => ({ ...q, totalAmount: q.totalAmount.toString() })));
  }

  if (user.role === 'business') {
    const { searchParams } = new URL(req.url);
    const rfqId = searchParams.get('rfqId');
    if (!rfqId) return NextResponse.json({ error: 'rfqId required' }, { status: 400 });

    const biz = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq || rfq.businessId !== biz?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const quotes = await prisma.quote.findMany({
      where:   { rfqId },
      orderBy: { submittedAt: 'desc' },
      include: { vendor: { select: { companyName: true, city: true, brands: true } } },
    });
    return NextResponse.json(quotes.map((q: any) => ({ ...q, totalAmount: q.totalAmount.toString() })));
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST /api/quotes — vendor submits a quote
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (user.role !== 'vendor') return NextResponse.json({ error: 'Only vendors can submit quotes' }, { status: 403 });

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });

  const body = await req.json();
  const { rfqId, totalAmount, lineItems, deliveryDays, warranty, paymentTerms, notes, proformaUrl, validityDays } = body;

  if (!rfqId || !totalAmount) return NextResponse.json({ error: 'rfqId and totalAmount are required' }, { status: 400 });

  // Verify vendor has unlocked this RFQ
  const unlock = await prisma.rfqUnlock.findUnique({
    where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
  });
  if (!unlock) return NextResponse.json({ error: 'You must unlock this RFQ before submitting a quote' }, { status: 403 });

  // Check not already quoted
  const existing = await prisma.quote.findFirst({ where: { rfqId, vendorId: vendor.id } });
  if (existing) return NextResponse.json({ error: 'You have already submitted a quote for this RFQ' }, { status: 409 });

  const quote = await prisma.quote.create({
    data: {
      rfqId,
      vendorId:    vendor.id,
      totalAmount: BigInt(Math.round(totalAmount)),
      lineItems:   lineItems || [],
      deliveryDays: deliveryDays || null,
      warranty:    warranty    || null,
      paymentTerms: paymentTerms || null,
      notes:       notes       || null,
      proformaUrl: proformaUrl || null,
      validityDays: validityDays || 14,
      status: 'SUBMITTED',
    },
    include: { rfq: { include: { business: { include: { user: true } } } } },
  });

  // Notify business owner
  const businessEmail = quote.rfq.business.user.email;
  await sendEmail({
    to:       businessEmail,
    template: 'quote-received',
    data: {
      rfqTitle:   quote.rfq.title,
      vendorName: vendor.companyName,
      amount:     Number(quote.totalAmount).toLocaleString('en-PK'),
      delivery:   deliveryDays ? `${deliveryDays} days` : 'Not specified',
      rfqId,
    },
  });

  return NextResponse.json({ success: true, quoteId: quote.id });
}
