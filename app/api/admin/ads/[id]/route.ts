import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const data: any = { updatedAt: new Date() }

  if (body.title !== undefined) {
    const t = typeof body.title === 'string' ? body.title.trim() : ''
    if (!t) return NextResponse.json({ error: 'Internal label is required' }, { status: 400 })
    data.title = t
  }
  if (body.imageUrl !== undefined) {
    const u = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
    if (!u) return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    if (!/^https?:\/\/\S+$/i.test(u)) {
      return NextResponse.json({ error: 'Image URL must start with http(s)://' }, { status: 400 })
    }
    data.imageUrl = u
  }
  if (body.linkUrl !== undefined) {
    const u = typeof body.linkUrl === 'string' ? body.linkUrl.trim() : ''
    if (u && !/^https?:\/\/\S+$/i.test(u)) {
      return NextResponse.json({ error: 'Click-through URL must start with http(s)://' }, { status: 400 })
    }
    data.linkUrl = u || null
  }
  if (body.placement !== undefined) {
    if (!['both', 'sidebar', 'content'].includes(body.placement)) {
      return NextResponse.json({ error: 'Invalid placement' }, { status: 400 })
    }
    data.placement = body.placement
  }
  if (body.showTo !== undefined) {
    if (!['all', 'vendor', 'business'].includes(body.showTo)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
    }
    data.showTo = body.showTo
  }
  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder)
    if (!Number.isFinite(n)) return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 })
    data.sortOrder = n
  }
  if (body.isActive !== undefined) {
    data.isActive = !!body.isActive
  }

  await prisma.advertisement.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await prisma.advertisement.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
