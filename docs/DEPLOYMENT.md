# AgentDesk Deployment Guide

## Environment Variables (Required)
Add ALL of these in Netlify → Site Settings → Environment Variables:

| Variable | Description | Where to get |
|---|---|---|
| MONGODB_URI | MongoDB Atlas connection string | Atlas → Connect → Drivers |
| MONGODB_DB_NAME | Database name (default: agentdesk) | Your choice |
| GROQ_API_KEY | Groq AI API key | console.groq.com |
| HUGGINGFACE_API_KEY | HuggingFace API key | huggingface.co/settings/tokens |
| NEXTAUTH_SECRET | Random 32+ char secret | run: openssl rand -base64 32 |
| NEXTAUTH_URL | Your live URL | https://agentdeskk.netlify.app |
| RESEND_API_KEY | Email service key | resend.com (free tier) |

## MongoDB Atlas Setup
1. Create cluster (M0 free tier is fine for MVP)
2. Create database user with readWrite permissions
3. Network access: Allow 0.0.0.0/0 (all IPs) for Netlify serverless
4. Create vector search index on knowledgechunks collection:
   Index name: vector_index
   Field: embedding (type: vector, dimensions: 384, similarity: cosine)

## Netlify Setup
1. Connect GitHub repo to Netlify
2. Build command: npm run build
3. Publish directory: .next
4. Add @netlify/plugin-nextjs plugin
5. Add all environment variables above

## Testing Checklist After Deploy
[ ] https://agentdeskk.netlify.app/ loads
[ ] https://agentdeskk.netlify.app/widget.js shows JS code (not error page)
[ ] https://agentdeskk.netlify.app/widget-test.html shows orange button
[ ] /register creates a user in MongoDB
[ ] /login works and sets session cookie
[ ] Dashboard loads after login
[ ] Widget chat returns AI responses
[ ] Ticket creation works
[ ] Email notification received (if RESEND_API_KEY set)
