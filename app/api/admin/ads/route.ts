import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const ads = await prisma.advertisement.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json(ads)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const ad = await prisma.advertisement.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl || null,
      linkUrl: body.linkUrl || null,
      bodyText: body.bodyText || null,
      contactEmail: body.contactEmail || null,
      bgColor: body.bgColor || null,
      textColor: body.textColor || null,
      placement: body.placement || 'both',
      isActive: body.isActive ?? true,
      showTo: body.showTo || 'all',
      sortOrder: body.sortOrder || 0,
    }
  })
  return NextResponse.json({ success: true, id: ad.id })
}
