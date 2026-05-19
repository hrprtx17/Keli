# AgentDesk Security Documentation

## Overview
AgentDesk is a SaaS AI chat platform. Security is critical because:
- Widget is embedded on external websites (cross-origin)
- User data (conversation history, emails) is stored
- AI API keys must be protected
- Multiple tenants share the same infrastructure

## Authentication & Sessions
- Auth provider: NextAuth.js with JWT strategy
- Session duration: 7 days
- Password hashing: bcrypt with 12 salt rounds
- JWT secret: NEXTAUTH_SECRET env var (required)
- Protected routes: all /dashboard/*, /agents/*, /settings/*, and /onboarding routes require valid session
- API routes: /api/agents, /api/tickets (GET) require session
- Public API routes: /api/widget-chat, /api/agents/public/* (no auth, CORS open)

## Public Widget API Security
The widget APIs (/api/widget-chat, /api/agents/public/[id]) are intentionally public (no auth) because they are called by the widget from external websites. They are secured by:
- Rate limiting: 20 requests/min per IP on /api/widget-chat
- Rate limiting: 5 requests/5min per IP on /api/tickets  
- Input validation: agentId format (strict 24-character ObjectId pattern check), message length, email format
- Prompt injection sanitization on user messages
- Agent ownership not exposed (only public fields returned)
- isActive check: inactive agents return 403

## Data Security
- MongoDB Atlas: network access restricted to production hosting IPs recommended
- Sensitive fields never returned by public APIs:
  systemPrompt, userId, ownerId, notificationEmail
- User passwords: never stored in plaintext (bcrypt)
- Conversation history: stored per session, linked to agentId only

## API Keys
Required environment variables (set in environment configuration, never in code):
  MONGODB_URI          - MongoDB Atlas connection string
  GROQ_API_KEY         - Groq AI API key  
  HUGGINGFACE_API_KEY  - HuggingFace embedding API key
  NEXTAUTH_SECRET      - Random 32+ char string for JWT signing
  NEXTAUTH_URL         - Production/local URL (http://localhost:3000)
  RESEND_API_KEY       - Email notification service

## Known Limitations (MVP)
- Rate limiting is in-memory (resets on function cold start)
  → For production: use Upstash Redis for persistent rate limiting
- No CAPTCHA on ticket submission
  → For production: add hCaptcha or Cloudflare Turnstile
- No domain allowlist for widget embedding
  → For production: let agent owners specify allowed domains
- No end-to-end encryption on stored conversations
  → Conversations stored as plaintext in MongoDB

## Security Headers
Applied via headers:
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  
Widget.js headers:
  Access-Control-Allow-Origin: * (required for cross-origin embedding)

## Incident Response
If API keys are compromised:
1. Immediately rotate in environment variables
2. Rotate in respective service dashboards (Groq, HuggingFace)
3. Invalidate all user sessions by changing NEXTAUTH_SECRET
4. Review MongoDB Atlas access logs
