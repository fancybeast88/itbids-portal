import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import prisma from './prisma'

export const BCRYPT_COST = 12

type LoginAttempts = { count: number; resetAt: number }
const loginAttempts = new Map<string, LoginAttempts>()
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

function checkLoginRate(email: string): boolean {
  const now = Date.now()
  let bucket = loginAttempts.get(email)
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + LOGIN_WINDOW_MS }
    loginAttempts.set(email, bucket)
  }
  bucket.count += 1
  if (loginAttempts.size > 5000) {
    for (const [k, b] of loginAttempts) if (b.resetAt < now) loginAttempts.delete(k)
  }
  return bucket.count <= LOGIN_LIMIT
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.trim().toLowerCase()
        if (!checkLoginRate(email)) {
          throw new Error('Too many login attempts. Try again in 15 minutes.')
        }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        if (user.status !== 'approved') {
          throw new Error('Account not yet approved')
        }
        return { id: user.id, email: user.email, name: user.role, role: user.role } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.uid  = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.uid as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}
