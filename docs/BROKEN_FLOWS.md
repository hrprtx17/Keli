# AgentDesk — Known Issues & Broken Flows

Last updated: May 17, 2026
Status: MVP Development

## Status Legend
✅ Working  ⚠️ Partial  ❌ Broken  🔧 Fixed in this session

## Flow 1: Widget Embed & Chat
- Widget.js loads: 🔧 Fixed in this session (vanilla DOM access completely null-safe and dynamic local host auto-routing implemented)
- Launcher appears: ✅ Confirmed working
- Panel opens on click: 🔧 Fixed in this session (fixed direct access exceptions by wrapping insideDOMContentLoaded and building with strict timing)
- Welcome message shows: ✅ Confirmed working
- User message sends: ✅ Confirmed working
- AI responds (streaming): 🔧 Fixed in this session (patched pump() SSE parser to correctly support multiple data: lines per TCP chunk and close controller in finally blocks)
- History maintained: ✅ Confirmed working
- Mobile layout correct: 🔧 Fixed in this session (added highly responsive CSS media queries overriding the default container panel style)

## Flow 2: Human Escalation & Tickets
- Auto-detection fires: ✅ Confirmed working
- Escalation banner shows: ✅ Confirmed working
- Manual 👤 button works: ✅ Confirmed working
- Ticket form validates: ✅ Confirmed working
- Ticket saves to MongoDB: ✅ Confirmed working
- Email notification sends: ⚠️ Partial (requires manual configuration of RESEND_API_KEY)
- Dashboard inbox loads: ✅ Confirmed working
- Ticket detail shows: ✅ Confirmed working
- Status update works: ✅ Confirmed working

## Flow 3: Training Data
- Website URL crawl: ✅ Confirmed working
- File upload: ✅ Confirmed working
- Embeddings generated: ✅ Confirmed working
- Vector search works: ✅ Confirmed working
- AI uses training data: ✅ Confirmed working

## Flow 4: Auth
- Register works: ✅ Confirmed working (hashes password with bcrypt, checks for duplicate email, and sets up active credentials session for onboarding)
- Login works: ✅ Confirmed working
- Session persists: ✅ Confirmed working (JWT strategy configured)
- Protected routes redirect: ✅ Confirmed working
- Google OAuth: ⚠️ Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

## Known Limitations (Cannot Fix Without External Config)

1. RESEND_API_KEY not set
   Impact: Ticket email notifications don't send
   Fix: Sign up at resend.com → get API key → add to .env.local or production env vars

2. HuggingFace cold start latency
   Impact: First embedding call takes 10-15s, may timeout
   Fix: Widget-chat route has 5s timeout fallback — RAG is skipped,
   AI still responds. Mitigated but not fully fixed.

3. MongoDB Atlas IP allowlist
   Impact: If Atlas is restricted, serverless/hosting IPs may be blocked
   Fix: In MongoDB Atlas → Network Access → Allow all (0.0.0.0/0)
   for development, or add your hosting provider's IP ranges for production.

4. Google OAuth
   Impact: "Continue with Google" button may not work
   Fix: Create Google OAuth app at console.cloud.google.com
   Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local or production env vars
