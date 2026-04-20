import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'admin') redirect('/admin/dashboard')
  if (session.user.role === 'vendor') redirect('/vendor/rfqs')
  if (session.user.role === 'business') redirect('/business/post-rfq')
  redirect('/login')
}
