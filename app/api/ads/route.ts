import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([])
  const role = (session.user as any).role
  const { searchParams } = new URL(req.url)
  const placement = searchParams.get('placement') || 'sidebar'

  const ads = await prisma.advertisement.findMany({
    where: {
      isActive: true,
      OR: [{ showTo: 'all' }, { showTo: role }],
      AND: [{ OR: [{ placement: 'both' }, { placement: placement }] }],
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 5,
  })
  return NextResponse.json(ads)
}
