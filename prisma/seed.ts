import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin@1234', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@itbids.pk' },
    update: {},
    create: {
      email: 'admin@itbids.pk',
      passwordHash: hash,
      role: 'admin',
      status: 'approved',
    },
  })

  const categories = [
    { category: 'Laptops', cost: 2 },
    { category: 'Desktops', cost: 2 },
    { category: 'Servers', cost: 3 },
    { category: 'Networking', cost: 2 },
    { category: 'Firewall', cost: 3 },
    { category: 'Storage', cost: 2 },
  ]

  for (const cat of categories) {
    await prisma.categoryCreditCost.upsert({
      where: { category: cat.category },
      update: {},
      create: cat,
    })
  }

  const packages = [
    { credits: 50,  pricePkr: 500,  label: null },
    { credits: 100, pricePkr: 1000, label: 'Most popular' },
    { credits: 250, pricePkr: 2200, label: 'Save PKR 300' },
  ]

  for (const pkg of packages) {
    const existing = await prisma.creditPackage.findFirst({ where: { credits: pkg.credits } })
    if (!existing) await prisma.creditPackage.create({ data: pkg })
  }

  console.log('Seed completed successfully')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
