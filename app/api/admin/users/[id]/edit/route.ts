import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { password, companyName, contactPerson, phone, city, ntn, partnerLevel, brands, creditsToAdd, status, role } = body

  const user = await prisma.user.findUnique({
    where: { id },
    include: { vendorProfile: true, businessProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (password) {
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id }, data: { passwordHash } })
  }

  const userUpdate: any = {}
  if (status) userUpdate.status = status
  if (role) userUpdate.role = role
  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id }, data: userUpdate })
  }

  if (user.vendorProfile) {
    const vendorUpdate: any = {}
    if (companyName) vendorUpdate.companyName = companyName
    if (contactPerson) vendorUpdate.contactPerson = contactPerson
    if (phone !== undefined) vendorUpdate.phone = phone
    if (city !== undefined) vendorUpdate.city = city
    if (ntn !== undefined) vendorUpdate.ntn = ntn
    if (partnerLevel !== undefined) vendorUpdate.partnerLevel = partnerLevel
    if (brands !== undefined) vendorUpdate.brands = brands
    if (Object.keys(vendorUpdate).length > 0) {
      await prisma.vendorProfile.update({ where: { userId: id }, data: vendorUpdate })
    }
    if (creditsToAdd && creditsToAdd !== 0) {
      await prisma.$transaction([
        prisma.vendorProfile.update({
          where: { userId: id },
          data: { credits: { increment: creditsToAdd } },
        }),
        prisma.creditTransaction.create({
          data: {
            vendorId: user.vendorProfile.id,
            type: 'manual',
            credits: creditsToAdd,
            status: 'confirmed',
          },
        }),
      ])
    }
  }

  if (user.businessProfile) {
    const bizUpdate: any = {}
    if (companyName) bizUpdate.companyName = companyName
    if (contactPerson) bizUpdate.contactPerson = contactPerson
    if (phone !== undefined) bizUpdate.phone = phone
    if (city !== undefined) bizUpdate.city = city
    if (ntn !== undefined) bizUpdate.ntn = ntn
    if (Object.keys(bizUpdate).length > 0) {
      await prisma.businessProfile.update({ where: { userId: id }, data: bizUpdate })
    }
  }

  return NextResponse.json({ success: true })
}
