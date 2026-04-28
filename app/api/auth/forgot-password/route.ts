import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    // Always respond OK so we don't leak which emails are registered.
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Invalidate previous outstanding tokens for this email.
    await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    })

    await sendEmail({
      to: normalizedEmail,
      template: 'password-reset',
      data: { token },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
