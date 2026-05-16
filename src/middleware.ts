import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  
  const isProtectedPage = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/agents') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding')

  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|agentdesk\\.js|widget-test\\.html|api/widget-chat|api/agents/public).*)',
  ],
}
