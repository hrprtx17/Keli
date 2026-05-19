// Programmatically enforce correct NextAuth/Auth.js base URL in production/serverless environments
if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  let deploymentUrl = '';
  
  if (process.env.VERCEL_URL) {
    deploymentUrl = `https://${process.env.VERCEL_URL}`;
  }
  
  if (deploymentUrl) {
    const cleanUrl = deploymentUrl.startsWith('http') ? deploymentUrl.replace(/\/+$/, '') : `https://${deploymentUrl.replace(/\/+$/, '')}`;
    
    // Enforce correct URL across NextAuth versions to override any stale localhost settings
    process.env.AUTH_URL = cleanUrl;
    process.env.NEXTAUTH_URL = cleanUrl;
    
    // Fallback override for absolute backend-constructed links
    if (!process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
      process.env.NEXT_PUBLIC_APP_URL = cleanUrl;
    }
  }
}

import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: { strategy: 'jwt' },
  trustHost: true,
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
