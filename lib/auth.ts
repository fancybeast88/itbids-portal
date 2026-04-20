import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

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
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error('Invalid email or password');
        if (user.status === 'PENDING')
          throw new Error('Your account is pending admin approval. You will receive an email once approved.');
        if (user.status === 'REJECTED')
          throw new Error('Your account application was not approved. Contact support.');
        if (user.status === 'SUSPENDED')
          throw new Error('Your account has been suspended. Contact support.');

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) throw new Error('Invalid email or password');

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id   = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id   = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
