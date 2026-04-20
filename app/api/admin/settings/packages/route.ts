import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { packages } = await req.json()
  await Promise.all(packages.map((p: any) =>
    prisma.creditPackage.update({ where: { id: p.id }, data: { credits: p.credits, pricePkr: p.pricePkr, label: p.label } })
  ))
  return NextResponse.json({ success: true })
}
