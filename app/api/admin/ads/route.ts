import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const ads = await prisma.advertisement.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(ads)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''

  if (!title) return NextResponse.json({ error: 'Internal label is required' }, { status: 400 })
  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required — banners are image-only' }, { status: 400 })
  }
  if (!/^https?:\/\/\S+$/i.test(imageUrl)) {
    return NextResponse.json({ error: 'Image URL must start with http(s)://' }, { status: 400 })
  }

  const linkUrl = typeof body.linkUrl === 'string' && body.linkUrl.trim() ? body.linkUrl.trim() : null
  if (linkUrl && !/^https?:\/\/\S+$/i.test(linkUrl)) {
    return NextResponse.json({ error: 'Click-through URL must start with http(s)://' }, { status: 400 })
  }

  const placement = ['both', 'sidebar', 'content'].includes(body.placement) ? body.placement : 'both'
  const showTo = ['all', 'vendor', 'business'].includes(body.showTo) ? body.showTo : 'all'
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0

  const ad = await prisma.advertisement.create({
    data: {
      title,
      imageUrl,
      linkUrl,
      placement,
      showTo,
      sortOrder,
      isActive: body.isActive ?? true,
      // bodyText / contactEmail / bgColor / textColor kept null - no longer rendered
    },
  })
  return NextResponse.json({ success: true, id: ad.id })
}
