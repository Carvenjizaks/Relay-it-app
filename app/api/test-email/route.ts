export async function POST(req: Request) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return Response.json({ error: "Email and name are required" }, { status: 400 })
    }

    const apiKey = process.env.SMTP_PASS
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const fromName = process.env.SMTP_FROM_NAME || "Relay-it"
    const channelName = process.env.SMTP_CHANNEL || "thefatherhoofoundation"

    if (!apiKey || !fromEmail) {
      return Response.json({
        error: "Email credentials not configured. Please set SMTP_PASS (API key) and SMTP_FROM_EMAIL."
      }, { status: 500 })
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
    <p>Sent via Relay-it</p>
  </div>
</body>
</html>`

    // Send via SMTP.com REST API v4
    const smtpRes = await fetch("https://api.smtp.com/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        channel: channelName,
        recipients: {
          to: [{ address: { email, name } }],
        },
        originator: {
          from: { address: { email: fromEmail, name: fromName } },
        },
        subject: "Test Email from Relay-it",
        body: {
          parts: [{ type: "text/html", content: html }],
        },
      }),
    })

    const smtpData = await smtpRes.json()

    if (!smtpRes.ok) {
      const errMsg = smtpData?.data?.message || smtpData?.message || JSON.stringify(smtpData)
      console.error("SMTP.com API error:", errMsg)
      return Response.json({ error: `Email send failed: ${errMsg}` }, { status: 500 })
    }

    return Response.json({ success: true, messageId: smtpData?.data?.id || "sent" })
  } catch (error) {
    console.error("Test email error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
