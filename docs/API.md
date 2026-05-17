# AgentDesk API Reference

## Public APIs (No Auth — Called by Widget)

### GET /api/agents/public/[agentId]
Returns public agent info for widget initialization.
CORS: open (*)

Response 200:
```json
{
  "name": "My AI Assistant",
  "welcomeMessage": "Hi! How can I help?",
  "themeColor": "#FF6B35",
  "isActive": true
}
```

Errors: 400 (invalid ID), 403 (not deployed), 404 (not found), 500

---

### POST /api/widget-chat
Sends a message and returns streaming AI response.
CORS: open (*)
Rate limit: 20 req/min per IP

Request body:
```json
{
  "agentId": "64abc...",
  "message": "Hello",
  "sessionId": "agd_abc123",
  "history": [{ "role": "user", "content": "..." }]
}
```

Response: text/event-stream (SSE)
```text
data: {"token":"Hello"}\n\n
data: {"token":" there"}\n\n
data: {"done":true}\n\n
```

Errors: 400, 403, 404, 429 (rate limited), 500, 502 (Groq down)

---

### POST /api/tickets
Creates a support ticket from widget.
CORS: open (*)
Rate limit: 5 req/5min per IP

Request body:
```json
{
  "agentId": "64abc...",
  "sessionId": "agd_abc123",
  "visitorName": "John Smith",
  "visitorEmail": "john@example.com",
  "subject": "Need help with billing",
  "description": "I cannot access my account",
  "conversationHistory": [...]
}
```

Response 200: 
```json
{ "success": true, "ticketId": "64abc..." }
```

Errors: 400, 404, 429, 500

---

## Authenticated APIs (Require NextAuth Session)

### GET /api/agents
Returns all agents for logged-in user.

### PATCH /api/agents/[agentId]
Updates agent settings.
Body: `{ name?, systemPrompt?, themeColor?, welcomeMessage?, isDeployed? }`

### GET /api/tickets?status=open&page=1
Returns paginated tickets for logged-in user's agents.

### PATCH /api/tickets/[ticketId]
Updates ticket status or notes.
Body: `{ status?, priority?, agentNotes? }`
