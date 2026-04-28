import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { apiError } from '@/lib/api';

const CreateRfqSchema = z.object({
  title: z.string().min(3).max(150),
  brand: z.string().min(1).max(80),
  category: z.string().min(1).max(80),
  quantity: z.string().max(80).optional().nullable(),
  budgetPkr: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  city: z.string().max(80).optional().nullable(),
  specs: z.string().max(4000).optional().nullable(),
});

// GET /api/rfqs — vendor sees approved RFQs (locked or unlocked)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError('Unauthorized', 401);

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const brand    = searchParams.get('brand');
    const category = searchParams.get('category');
    const search   = searchParams.get('search');

    const where: any = {};
    if (user.role === 'vendor') where.status = 'approved';
    if (user.role === 'business') {
      const biz = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
      if (biz) where.businessId = biz.id;
    }
    if (brand)    where.brand    = brand;
    if (category) where.category = category;
    if (search)   where.title    = { contains: search, mode: 'insensitive' };

    const rfqs = await prisma.rfq.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { business: { select: { companyName: true, city: true } } },
    });

    if (user.role === 'vendor') {
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
      const unlocks = vendor
        ? await prisma.rfqUnlock.findMany({ where: { vendorId: vendor.id } })
        : [];
      const unlockedIds = new Set(unlocks.map((u) => u.rfqId));

      return NextResponse.json(rfqs.map((rfq) => {
        const unlocked = unlockedIds.has(rfq.id);
        if (unlocked) return { ...rfq, unlocked: true };
        return {
          id:         rfq.id,
          title:      rfq.title,
          brand:      rfq.brand,
          category:   rfq.category,
          city:       rfq.city,
          creditCost: rfq.creditCost,
          status:     rfq.status,
          createdAt:  rfq.createdAt,
          unlocked:   false,
        };
      }));
    }

    return NextResponse.json(rfqs);
  } catch {
    return apiError('Failed to load RFQs', 500);
  }
}

// POST /api/rfqs — business creates RFQ
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError('Unauthorized', 401);

    const user = session.user as any;
    if (user.role !== 'business') return apiError('Only businesses can post RFQs', 403);

    const biz = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    if (!biz) return apiError('Business profile not found', 404);

    const parsed = CreateRfqSchema.safeParse(await req.json());
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid RFQ payload', 400);

    const { title, brand, category, quantity, budgetPkr, city, specs } = parsed.data;
    const costRow = await prisma.categoryCreditCost.findUnique({ where: { category } });
    const creditCost = costRow?.cost ?? 2;

    const settings = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } });
    const postFee = settings?.rfqPostFee ?? 50;

    if (biz.credits < postFee) {
      return apiError(`You need ${postFee} credits to post an RFQ.`, 402);
    }

    try {
      const rfq = await prisma.$transaction(async (tx) => {
        const decrement = await tx.businessProfile.updateMany({
          where: { id: biz.id, credits: { gte: postFee } },
          data: { credits: { decrement: postFee } },
        });
        if (decrement.count === 0) throw new Error('INSUFFICIENT_CREDITS');

        const created = await tx.rfq.create({
          data: {
            businessId: biz.id,
            title,
            brand,
            category,
            quantity: quantity || null,
            budgetPkr: typeof budgetPkr === 'number' ? BigInt(Math.round(budgetPkr)) : null,
            city:     city     || biz.city,
            specs:    specs    || null,
            creditCost,
            status: 'pending',
          },
        });

        await tx.businessCreditTransaction.create({
          data: {
            bizId: biz.id,
            type: 'rfq-post',
            credits: -postFee,
            rfqId: created.id,
            status: 'confirmed',
          },
        });

        return created;
      });

      return NextResponse.json({ success: true, rfq: { ...rfq, budget: rfq.budgetPkr?.toString() } });
    } catch (err: any) {
      if (err?.message === 'INSUFFICIENT_CREDITS') {
        return apiError(`You need ${postFee} credits to post an RFQ.`, 402);
      }
      throw err;
    }
  } catch {
    return apiError('Failed to create RFQ', 500);
  }
}
