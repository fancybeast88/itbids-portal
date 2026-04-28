import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { BCRYPT_COST } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { key: 'register', limit: 5, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await req.json();
    const { email, password, role, companyName, contactPerson, phone, city, ntn, brands, partnerLevel } = body;

    if (!email || !password || !role || !companyName || !contactPerson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!['vendor', 'business'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role,
          status: 'pending',
        },
      });

      if (role === 'vendor') {
        await tx.vendorProfile.create({
          data: {
            userId: user.id,
            companyName,
            contactPerson,
            phone: phone || null,
            city:  city  || null,
            ntn:   ntn   || null,
            brands: Array.isArray(brands) ? brands : [],
            partnerLevel: partnerLevel || null,
            credits: 0,
          },
        });
      } else {
        await tx.businessProfile.create({
          data: {
            userId: user.id,
            companyName,
            contactPerson,
            phone: phone || null,
            city:  city  || null,
            ntn:   ntn   || null,
          },
        });
      }
    });

    // Notify user
    await sendEmail({ to: normalizedEmail, template: 'account-pending', data: { companyName, role } });

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@itbids.pk';
    await sendEmail({
      to: adminEmail,
      template: 'admin-new-registration',
      data: { companyName, role, email: normalizedEmail, city },
    });

    return NextResponse.json({ success: true, message: 'Registration submitted. Pending admin approval.' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
