import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const ads = await prisma.advertisement.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(ads)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { title, imageUrl, linkUrl, bodyText, contactEmail, isActive, showTo } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const ad = await prisma.advertisement.create({
    data: { title, imageUrl: imageUrl||null, linkUrl: linkUrl||null, bodyText: bodyText||null, contactEmail: contactEmail||null, isActive: isActive??true, showTo: showTo||'all' }
  })
  return NextResponse.json({ success: true, id: ad.id })
}
