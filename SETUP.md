# 🚀 AgentDesk Production Orchestration Guide

Follow this roadmap exactly to transition from local development context to an active, high-fidelity SaaS environment.

## 1. Core Dependency Matrix

You must retrieve and populate these explicit variable keys inside your `.env.local` filesystem root.

### 💾 Persistence Layer (MongoDB)
1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Instantiate a Free Shared Cluster (M0 tier).
3. Under "Database Access", create a user with `readWriteAnyDatabase` privilege.
4. Under "Network Access", add `0.0.0.0/0` or your production static IP.
5. Click **Connect** -> "Connect your application" and copy the Connection String.
6. **Insert into:** `MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/agentdesk?retryWrites=true&w=majority`

### 🧠 Intelligence Grid (Groq)
1. Create an account at [console.groq.com](https://console.groq.com/).
2. Navigate to "API Keys" and generate a new Production Secret.
3. **Insert into:** `GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx`

### 🔐 Security & Auth (Google)
1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project called `AgentDesk`.
3. Set up **OAuth Consent Screen** (External).
4. Navigate to "Credentials" -> "Create Credentials" -> "OAuth Client ID" -> "Web Application".
5. Add Authorized Redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL later).
6. **Insert into:**
   - `GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx`

### 💳 Checkout & Metering (Dodo Payments)
1. Sign into [DodoPayments Dashboard](https://app.dodopayments.com/).
2. Copy your `Test/Live Api Key`.
3. Retrieve your unique `Webhook Signing Key` from the Developers / Webhooks page.
4. **Insert into:**
   - `DODO_API_KEY=dodo_xxxxxxxxxxxx`
   - `DODO_WEBHOOK_SECRET=whsec_xxxxxxxxxx`

### ✉️ Dispatch (Resend)
1. Sign up at [resend.com](https://resend.com).
2. Provision a verified Sending Domain.
3. Generate an API token.
4. **Insert into:** `RESEND_API_KEY=re_xxxxxxxxxxxx`

---

## 1. Prerequisites
- **Node.js**: `v20.9.0` or higher is **required** (Check with `node -v`).
- **Database**: MongoDB Atlas cluster with Vector Search enabled.
- **AI Keys**: Groq and HuggingFace API keys.

## 2. Runtime Initialization Procedures

Once `.env.local` is hydrated, follow these execution mandates:

### I. Dependency Validation
Ensure strict alignment of binary node packages.
```bash
npm install
```

### II. Clean Boot
Ensure any cached compilation artifacts from previous sessions are destroyed prior to hydration.
```bash
# Wipe Next cache to force total hydration
rmdir /s /q .next
npm run dev
```

### III. Webhook Tunnelling (For Payments Testing)
Dodo Payments needs a bridge to reach your `localhost` environment. Use **ngrok** to pipe triggers:
```bash
ngrok http 3000
```
*Then, copy your Ngrok forwarded URL (`https://xxxx.ngrok.app`) and insert into Dodo Payments Webhooks page as:* `https://xxxx.ngrok.app/api/webhooks/dodo`

---

## 3. Live Deployment Verification

Execute this visual auditing sequence to confirm architectural coherence:
1. **Auth**: Navigate to `/login` and initiate Google OAuth. Confirm entry into `/dashboard`.
2. **Agent Creation**: Go to `Agents` -> `Create`. Confirm entry writes into MongoDB cluster.
3. **Sandbox Testing**: Open agent Playground and transmit raw text. Confirm sub-second response arrival.
4. **Telemetry Evaluation**: Check `/usage`. Confirm immediate aggregation spike appears corresponding to sandbox utilization.
5. **Monetization Loop**: Visit `/plans`, select Premium. Confirm seamless hand-off to external Dodo checkout plane.

***

*Architecture validated and ready for production activation.*
