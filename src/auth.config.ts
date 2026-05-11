import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.workspaceId = (user as any).workspaceId
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).workspaceId = token.workspaceId as string
      }
      return session
    }
  },
  providers: [], // Will be configured in auth.ts
} satisfies NextAuthConfig
