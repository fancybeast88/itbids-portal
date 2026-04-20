import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, companyName, contactPerson, phone, city, ntn, brands, partnerLevel } = body;

    if (!email || !password || !role || !companyName || !contactPerson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['vendor', 'business'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: 'pending',
      },
    });

    if (role === 'vendor') {
      await prisma.vendorProfile.create({
        data: {
          userId: user.id,
          companyName,
          contactPerson,
          phone: phone || null,
          city:  city  || null,
          ntn:   ntn   || null,
          brands: brands || [],
          partnerLevel: partnerLevel || null,
          credits: 0,
        },
      });
    } else {
      await prisma.businessProfile.create({
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

    // Notify user
    await sendEmail({ to: email, template: 'account-pending', data: { companyName, role } });

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@itbids.pk';
    await sendEmail({
      to: adminEmail,
      template: 'admin-new-registration',
      data: { companyName, role, email, city },
    });

    return NextResponse.json({ success: true, message: 'Registration submitted. Pending admin approval.' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
