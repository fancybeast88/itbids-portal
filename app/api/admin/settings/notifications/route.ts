import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { settings } = await req.json()
  await Promise.all(Object.entries(settings).map(([key, value]) =>
    prisma.emailSettings.upsert({
      where: { key },
      update: { value: value as boolean },
      create: { key, value: value as boolean },
    })
  ))
  return NextResponse.json({ success: true })
}
