import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) throw new Error('Invalid email or password')
        if (user.status === 'pending')
          throw new Error('Account pending approval.')
        if (user.status === 'rejected')
          throw new Error('Account not approved.')
        if (user.status === 'suspended')
          throw new Error('Account suspended.')
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) throw new Error('Invalid email or password')
        return { id: user.id, email: user.email, name: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.name as string
        token.uid  = user.id as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id   = token.uid as string
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
