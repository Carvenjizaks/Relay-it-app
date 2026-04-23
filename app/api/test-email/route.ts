import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return Response.json({ error: "Email and name are required" }, { status: 400 })
    }

    const smtpHost = process.env.SMTP_HOST || "send.smtp.com"
    const smtpPort = parseInt(process.env.SMTP_PORT || "2525")
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser
    const fromName = process.env.SMTP_FROM_NAME || "Relay-it"

    if (!smtpUser || !smtpPass) {
      return Response.json({
        error: "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS."
      }, { status: 500 })
    }

    // Configure nodemailer with SMTP.com settings
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

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

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Test Email from Relay-it",
      html,
    })

    return Response.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Test email error:", error)
    const message = error instanceof Error ? error.message : "Failed to send email"
    
    let friendlyMessage = message
    if (message.includes("535") || message.includes("Invalid login")) {
      friendlyMessage = "SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS credentials."
    } else if (message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT")) {
      friendlyMessage = "Cannot connect to SMTP server. Try changing SMTP_PORT to 2525, 587, or 465."
    }

    return Response.json({ error: friendlyMessage }, { status: 500 })
  }
}
