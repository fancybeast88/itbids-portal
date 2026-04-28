import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }
    if (record.expiresAt.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {})
      return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } })
    if (!user) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {})
      return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { email: record.email } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('reset-password error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
