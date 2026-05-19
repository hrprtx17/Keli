# AgentDesk Deployment Guide

## Environment Variables (Required)
Add ALL of these in your .env.local file (for local development) or your hosting provider's environment settings:

| Variable | Description | Where to get |
|---|---|---|
| MONGODB_URI | MongoDB Atlas connection string | Atlas → Connect → Drivers |
| MONGODB_DB_NAME | Database name (default: agentdesk) | Your choice |
| GROQ_API_KEY | Groq AI API key | console.groq.com |
| HUGGINGFACE_API_KEY | HuggingFace API key | huggingface.co/settings/tokens |
| NEXTAUTH_SECRET | Random 32+ char secret | run: openssl rand -base64 32 |
| NEXTAUTH_URL | Your live URL | http://localhost:3000 |
| RESEND_API_KEY | Email service key | resend.com (free tier) |

## MongoDB Atlas Setup
1. Create cluster (M0 free tier is fine for MVP)
2. Create database user with readWrite permissions
3. Network access: Allow 0.0.0.0/0 (all IPs) or restrict to your hosting environment's IP range
4. Create vector search index on knowledgechunks collection:
   Index name: vector_index
   Field: embedding (type: vector, dimensions: 384, similarity: cosine)

## Deployment / Running Locally
1. Run `npm run build` to build the Next.js production bundle.
2. Run `npm run start` to start the standalone production server.
3. Configure all environment variables listed above.

## Testing Checklist After Deploy
[ ] http://localhost:3000/ loads
[ ] http://localhost:3000/widget.js shows JS code (not error page)
[ ] http://localhost:3000/widget-test.html shows orange button
[ ] /register creates a user in MongoDB
[ ] /login works and sets session cookie
[ ] Dashboard loads after login
[ ] Widget chat returns AI responses
[ ] Ticket creation works
[ ] Email notification received (if RESEND_API_KEY set)
