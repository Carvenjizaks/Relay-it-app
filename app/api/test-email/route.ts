import { emailConfig } from "@/lib/smtp-config"

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return Response.json({ error: "Email and name are required" }, { status: 400 })
    }

    const apiKey = emailConfig.apiKey
    const inboxId = emailConfig.inboxId

    if (!apiKey) {
      return Response.json({ error: "AGENTMAIL_API_KEY is not set." }, { status: 500 })
    }

    if (!inboxId) {
      return Response.json({ error: "AGENTMAIL_INBOX_ID is not set." }, { status: 500 })
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:20px;background:#3b82f6;border-radius:8px;margin-bottom:20px;">
    <h1 style="color:white;margin:0;">Relay-it</h1>
  </div>
  <div style="padding:20px;background:#f9fafb;border-radius:8px;">
    <p>Hi ${name},</p>
    <p>This is a test email from Relay-it to confirm your email configuration is working correctly.</p>
    <p>If you received this, emails are properly configured and ready to send!</p>
    <p>Best regards,<br>The Relay-it Team</p>
  </div>
  <div style="text-align:center;margin-top:20px;color:#666;font-size:12px;">
    <p>Sent via Relay-it using AgentMail</p>
  </div>
</body>
</html>`

    const payload = {
      to: email,
      subject: "Test Email from Relay-it",
      html,
    }

    console.log("[v0] Sending test email via AgentMail:", JSON.stringify({ inboxId, to: email }))

    const response = await fetch(`https://api.agentmail.to/v0/inboxes/${inboxId}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log("[v0] AgentMail API response:", JSON.stringify(data))

    if (!response.ok) {
      return Response.json({
        error: `AgentMail API error: ${JSON.stringify(data)}`,
        debug: { inboxId, statusCode: response.status }
      }, { status: 500 })
    }

    return Response.json({ success: true, messageId: data?.message_id || "sent" })
  } catch (error) {
    console.error("[v0] Test email error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
