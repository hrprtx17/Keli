interface EmailTicketParams {
  to: string
  agentName: string
  visitorName: string
  visitorEmail: string
  subject: string
  description: string
  ticketId: string
}

export async function sendTicketEmail(params: EmailTicketParams) {
  const {
    to, agentName, visitorName, visitorEmail,
    subject, description, ticketId
  } = params
  
  if (!to) {
    console.log('[AgentDesk] No notification email configured for this agent')
    return
  }
  
  if (!process.env.RESEND_API_KEY) {
    console.log('[AgentDesk] Email skipped (no RESEND_API_KEY):', {
      to, subject, visitorEmail
    })
    return
  }
  
  const dashboardUrl = `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://agentdeskk.netlify.app'}/dashboard/inbox?ticket=${ticketId}`
  
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                max-width:600px;margin:0 auto;padding:24px;color:#111;">
      <div style="background:#FF6B35;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">New Support Ticket</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px;">
          ${agentName} — AgentDesk
        </p>
      </div>
      <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;
                  border:1px solid #e5e7eb;border-top:none;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:120px;">From</td>
            <td style="padding:8px 0;font-weight:500;">${visitorName} (${visitorEmail})</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Subject</td>
            <td style="padding:8px 0;">${subject}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Ticket ID</td>
            <td style="padding:8px 0;font-family:monospace;font-size:12px;">${ticketId}</td>
          </tr>
        </table>
        
        <div style="margin-top:16px;padding:16px;background:white;
                    border-radius:8px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:500;color:#6b7280;
                    text-transform:uppercase;letter-spacing:0.05em;">Issue description</p>
          <p style="margin:0;font-size:14px;line-height:1.6;">${description}</p>
        </div>
        
        <a href="${dashboardUrl}"
           style="display:inline-block;margin-top:20px;background:#FF6B35;
                  color:white;text-decoration:none;padding:12px 24px;
                  border-radius:8px;font-weight:500;font-size:14px;">
          View Ticket in Dashboard →
        </a>
        
        <p style="margin-top:20px;font-size:12px;color:#9ca3af;">
          This notification was sent by AgentDesk. 
          The customer expects a reply at ${visitorEmail}.
        </p>
      </div>
    </div>
  `
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'AgentDesk Notifications <notifications@agentdeskk.netlify.app>',
      to: [to],
      subject: `[New Ticket] ${subject} — from ${visitorName}`,
      html
    })
  })
  
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Resend API error: ${err}`)
  }
  
  return response.json()
}
