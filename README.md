# ⚡ KELI AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)](https://www.mongodb.com/)
[![LLM Speed](https://img.shields.io/badge/LLM-Llama%203.1%208B%20%7C%20Groq-orange?logo=meta)](https://groq.com/)

An ultra-premium, high-performance, self-service customer support automation engine and ticket management platform. **Keli AI** empowers businesses to train autonomous AI assistants on their custom websites/documents and embed them onto any tech stack in under 2 minutes.

---

## ✨ Features Overview

### 🤖 Autonomous Support Agents
* **Instant HTML Embedding**: Integrate the lightweight floating widget into any platform with a single script tag.
* **Intelligent Auto-Crawl**: Input any URL and the engine automatically crawls, extracts, indexes, and structures information into the agent's knowledge base.
* **Visual Customizer Sandbox**: Test and play with settings in a beautiful live playground, tailoring color themes and greetings with immediate visual previews.
* **Human-in-the-Loop Hand-off**: Automatically transitions queries into tickets for human support representatives when an issue requires complex attention.

### 🎫 Live Ticketing & Customer Inbox
* **Unified Console**: Manage active support chats, resolve tickets, and interact with leads in a real-time, sleek dashboard.
* **Agent Diagnostics**: Track exactly what sources and pages the AI used to formulate its responses.

### 📊 Real-Time Analytics
* **Dashboard Instrumentation**: Track total chat sessions, ticket resolution efficiency, most active hours, and query volumes in a high-fidelity visual interface.

---

## 🚀 Directory & File Structure

```alignment
├── public/                  # Static assets & scripts
│   ├── logos/               # Folder for light/dark theme SVG/PNG logos
│   ├── keli.js              # Fully self-contained lightweight async widget loader
│   └── widget.js            # Live floating assistant chat launcher bundle
├── src/
│   ├── app/                 # Next.js App Router Routes
│   │   ├── api/             # High-performance serverless REST API endpoints
│   │   │   ├── chat/        # Groq-powered Llama 3.1 8B streaming chat processor
│   │   │   ├── datasources/ # Crawler, indexing, and text processing pipelines
│   │   │   └── workspace/   # Security clearence whitelists and settings manager
│   │   ├── dashboard/       # Main operator command console & deploy managers
│   │   ├── agents/          # Visual sandbox playgrounds and identity controllers
│   │   └── page.tsx         # Liquid-glass, highly responsive landing page
│   ├── components/          # Reusable React components
│   │   ├── dashboard/       # Sidebar, stats widgets, and custom tables
│   │   ├── ui/              # Radix UI primitives (Switches, tabs, overlays)
│   │   └── Logo.tsx         # Pure typographic vector branding with pulse indicator
│   ├── lib/                 # Database initialization, models, and shared utilities
│   └── providers/           # Query, NextAuth, and Theme wrappers
├── package.json             # Build configurations & module packages
└── tailwind.config.ts       # Design tokens & color system
```

---

## 🛠️ Getting Started & Local Installation

### 1. Set Up Environment Settings
Create a `.env.local` file in the root directory:
```env
# Database Settings
MONGODB_URI=your_mongodb_connection_string

# Authentication System
AUTH_SECRET=generate_any_secure_random_key
NEXTAUTH_URL=http://localhost:3000

# Groq LLM API Key
GROQ_API_KEY=your_groq_api_access_key

# Optional: Email Notifications (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 2. Install Dependencies
Initialize and sync the node packages:
```bash
npm install
```

### 3. Start Development Server
Initiate the lightning-fast dev server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

### 4. Production Build & Deployment
To validate TypeScript compile safety and bundle for production:
```bash
npm run build
npm start
```

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
