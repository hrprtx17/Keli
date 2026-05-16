import { auth } from "@/auth"

export default auth((req) => {
  // Add custom middleware logic here if needed
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|widget\\.js|widget-test\\.html|api/widget-chat|api/agents/public).*)',
  ],
}
