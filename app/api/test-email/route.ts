import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return Response.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Check SMTP config
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return Response.json({ 
        error: "SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables." 
      }, { status: 500 })
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const fromName = process.env.SMTP_FROM_NAME || "Relay-it"
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    // Send test email
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Test Email from Relay-it",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px; background: linear-gradient(to right, #3b82f6, #f59e0b); border-radius: 8px; margin-bottom: 20px; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relay-it</h1>
  </div>
  <div class="content">
    <p>Hi ${name},</p>
    <p>This is a test email from Relay-it to confirm your SMTP configuration is working correctly.</p>
    <p>If you received this email, your email sending is properly configured!</p>
    <p>Best regards,<br>The Relay-it Team</p>
  </div>
  <div class="footer">
    <p>Sent via Relay-it Email Test</p>
  </div>
</body>
</html>
      `,
    })

    console.log("[v0] Test email sent successfully:", info.messageId)
    return Response.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("[v0] Test email error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
