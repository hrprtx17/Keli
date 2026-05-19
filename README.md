# ⚡ Keli AI

An elegant, high-performance, self-service AI support assistant and ticket management platform built with Next.js, Groq, and MongoDB.

## 🚀 Getting Started

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Authentication Secrets
AUTH_SECRET=your_auth_secret_key
NEXTAUTH_URL=http://localhost:3000

# AI Provider API Keys
GROQ_API_KEY=your_groq_api_key

# Optional: Email Service
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build and Production Deploy
```bash
npm run build
npm start
```

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router, Turbopack)
- **Styling**: Tailwind CSS & Vanilla CSS (Optimized for Mobile/PC)
- **Database**: MongoDB (Native Driver & Mongoose)
- **AI Integrations**: Llama-3.1-8B (via Groq API)
- **Auth**: NextAuth.js / Auth.js
