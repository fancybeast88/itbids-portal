import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/rfqs — vendor sees approved RFQs (locked or unlocked)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // For vendors: determine unlock status, hide sensitive fields if locked
  if (user.role === 'vendor') {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
    const unlocks = vendor
      ? await prisma.rfqUnlock.findMany({ where: { vendorId: vendor.id } })
      : [];
    const unlockedIds = new Set(unlocks.map((u) => u.rfqId));

    return NextResponse.json(rfqs.map((rfq) => {
      const unlocked = unlockedIds.has(rfq.id);
      if (unlocked) return { ...rfq, unlocked: true };
      // Locked — hide sensitive fields
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
}

// POST /api/rfqs — business creates RFQ
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'business') return NextResponse.json({ error: 'Only businesses can post RFQs' }, { status: 403 });

  const biz = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
  if (!biz) return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });

  const body = await req.json();
  const { title, brand, category, quantity, budget, city, specs } = body;

  if (!title || !brand || !category) {
    return NextResponse.json({ error: 'Title, brand, and category are required' }, { status: 400 });
  }

  const costRow = await prisma.categoryCreditCost.findUnique({ where: { category } });
  const creditCost = costRow?.cost ?? 2;

  const rfq = await prisma.rfq.create({
    data: {
      businessId: biz.id,
      title,
      brand,
      category,
      quantity: quantity || null,
      budgetPkr: budget ? BigInt(budget) : null,
      city:     city     || biz.city,
      specs:    specs    || null,
      creditCost,
      status: 'pending',
    },
  });

  return NextResponse.json({ success: true, rfq: { ...rfq, budget: rfq.budgetPkr?.toString() } });
}
