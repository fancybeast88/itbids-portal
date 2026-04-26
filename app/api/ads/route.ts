import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([])
  const role = (session.user as any).role
  const ads = await prisma.advertisement.findMany({
    where: {
      isActive: true,
      OR: [{ showTo: 'all' }, { showTo: role }],
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
  return NextResponse.json(ads)
}
