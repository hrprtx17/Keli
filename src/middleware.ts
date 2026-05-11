import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = 
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register')
  const isDashboard = 
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/agents') ||
    req.nextUrl.pathname.startsWith('/tickets') ||
    req.nextUrl.pathname.startsWith('/settings') ||
    req.nextUrl.pathname.startsWith('/billing')

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(
      new URL('/login', req.nextUrl)
    )
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(
      new URL('/dashboard', req.nextUrl)
    )
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|widget).*)'
  ]
}
