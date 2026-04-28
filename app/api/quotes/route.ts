import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';
import { apiError, normalizeStatus } from '@/lib/api';

const CreateQuoteSchema = z.object({
  rfqId: z.string().min(1),
  totalAmount: z.coerce.number().positive(),
  lineItems: z.any().optional(),
  deliveryDays: z.string().max(100).optional().nullable(),
  warranty: z.string().max(500).optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  proformaUrl: z.string().url().optional().nullable(),
  validityDays: z.coerce.number().int().min(1).max(90).optional().nullable(),
});

// GET /api/quotes — vendor gets their quotes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError('Unauthorized', 401);
    const user = session.user as any;

    if (user.role === 'vendor') {
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
      if (!vendor) return apiError('Not found', 404);

      const quotes = await prisma.quote.findMany({
        where:   { vendorId: vendor.id },
        orderBy: { submittedAt: 'desc' },
        include: { rfq: { select: { title: true, brand: true } } },
      });
      return NextResponse.json(quotes.map((q: any) => ({
        ...q,
        status: normalizeStatus(q.status),
        totalAmount: q.totalAmount.toString(),
      })));
    }

    if (user.role === 'business') {
      const { searchParams } = new URL(req.url);
      const rfqId = searchParams.get('rfqId');
      if (!rfqId) return apiError('rfqId required', 400);

      const biz = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
      const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
      if (!rfq || rfq.businessId !== biz?.id) return apiError('Forbidden', 403);

      const quotes = await prisma.quote.findMany({
        where:   { rfqId },
        orderBy: { submittedAt: 'desc' },
        include: { vendor: { select: { companyName: true, city: true, brands: true } } },
      });
      return NextResponse.json(quotes.map((q: any) => ({
        ...q,
        status: normalizeStatus(q.status),
        totalAmount: q.totalAmount.toString(),
      })));
    }

    return apiError('Forbidden', 403);
  } catch {
    return apiError('Failed to load quotes', 500);
  }
}

// POST /api/quotes — vendor submits a quote
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError('Unauthorized', 401);
    const user = session.user as any;
    if (user.role !== 'vendor') return apiError('Only vendors can submit quotes', 403);

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
    if (!vendor) return apiError('Vendor profile not found', 404);

    const parsed = CreateQuoteSchema.safeParse(await req.json());
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid quote payload', 400);
    const { rfqId, totalAmount, lineItems, deliveryDays, warranty, paymentTerms, notes, proformaUrl, validityDays } = parsed.data;

    const unlock = await prisma.rfqUnlock.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
    });
    if (!unlock) return apiError('You must unlock this RFQ before submitting a quote', 403);

    const existing = await prisma.quote.findFirst({ where: { rfqId, vendorId: vendor.id } });
    if (existing) return apiError('You have already submitted a quote for this RFQ', 409);

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
        status: 'submitted',
      },
      include: { rfq: { include: { business: { include: { user: true } } } } },
    });

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
    }).catch(() => {});

    return NextResponse.json({ success: true, quoteId: quote.id });
  } catch {
    return apiError('Failed to submit quote', 500);
  }
}
