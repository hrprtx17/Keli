import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      authorize: async (credentials) => {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
        const rateLimitResult = await rateLimit(`auth:${ip}`, 5, 60 * 1000, ip, '/api/auth')
        
        if (!rateLimitResult.success) {
          throw new Error('Too many login attempts. Please try again later.')
        }

        await connectDB()
        const user = await User.findOne({ email: credentials.email })
        if (!user || !user.password) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId?.toString()
        }
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ]
})
