import nodemailer from "nodemailer"

// SMTP.com REST API method (primary)
async function sendViaSmtpApi(
  to: { email: string; name: string },
  from: { email: string; name: string },
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.SMTP_API_KEY
  const channel = process.env.SMTP_CHANNEL || "default"

  if (!apiKey) {
    return { success: false, error: "SMTP_API_KEY not configured" }
  }

  try {
    const response = await fetch("https://api.smtp.com/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        channel,
        recipients: {
          to: [{ address: { email: to.email, name: to.name } }],
        },
        originator: {
          from: { address: { email: from.email, name: from.name } },
        },
        subject,
        body: {
          parts: [{ type: "text/html", content: html }],
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errMsg = data?.data?.message || data?.message || JSON.stringify(data)
      return { success: false, error: errMsg }
    }

    return { success: true, messageId: data?.data?.message_id || "sent" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "API request failed" }
  }
}

// Nodemailer method (fallback)
async function sendViaNodemailer(
  to: { email: string; name: string },
  from: { email: string; name: string },
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    return { success: false, error: "SMTP_USER and SMTP_PASS not configured" }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "send.smtp.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    const info = await transporter.sendMail({
      from: `"${from.name}" <${from.email}>`,
      to: to.email,
      subject,
      html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "SMTP send failed" }
  }
}

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return Response.json({ error: "Email and name are required" }, { status: 400 })
    }

    const fromEmail = process.env.SMTP_SENDER_EMAIL || "noreply@relay-it.app"
    const fromName = process.env.SMTP_SENDER_NAME || "Relay-it"

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

    // Debug: log all SMTP config (mask passwords)
    console.log("[v0] SMTP Config Debug:", {
      SMTP_API_KEY: process.env.SMTP_API_KEY ? `${process.env.SMTP_API_KEY.slice(0, 6)}...` : "NOT SET",
      SMTP_CHANNEL: process.env.SMTP_CHANNEL || "NOT SET",
      SMTP_USER: process.env.SMTP_USER || "NOT SET",
      SMTP_PASS: process.env.SMTP_PASS ? `${process.env.SMTP_PASS.slice(0, 6)}...` : "NOT SET",
      SMTP_HOST: process.env.SMTP_HOST || "NOT SET",
      SMTP_PORT: process.env.SMTP_PORT || "NOT SET",
      SMTP_SENDER_EMAIL: process.env.SMTP_SENDER_EMAIL || "NOT SET",
      SMTP_SENDER_NAME: process.env.SMTP_SENDER_NAME || "NOT SET",
    })

    // Try SMTP.com API first, fallback to nodemailer
    let result = await sendViaSmtpApi(
      { email, name },
      { email: fromEmail, name: fromName },
      "Test Email from Relay-it",
      html
    )

    if (!result.success) {
      console.log("[v0] SMTP API failed:", result.error)
      result = await sendViaNodemailer(
        { email, name },
        { email: fromEmail, name: fromName },
        "Test Email from Relay-it",
        html
      )
    }

    if (!result.success) {
      console.log("[v0] Nodemailer also failed:", result.error)
      return Response.json({ 
        error: result.error,
        debug: {
          apiKeySet: !!process.env.SMTP_API_KEY,
          channel: process.env.SMTP_CHANNEL || "NOT SET",
          smtpUser: process.env.SMTP_USER || "NOT SET",
          smtpPassSet: !!process.env.SMTP_PASS,
          senderEmail: fromEmail,
        }
      }, { status: 500 })
    }

    return Response.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Test email error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
