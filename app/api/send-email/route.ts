import nodemailer from "nodemailer"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      campaignId,
      recipientEmail, 
      recipientName, 
      senderName,
      senderEmail,
      subject, 
      htmlContent,
      eventUrl,
      relayToken,
      contactId,
      isRelay
    } = body

    const supabase = await createClient()

    // Get campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Build the relay URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const relayPageUrl = `${baseUrl}/relay/${relayToken}`
    const unsubscribeUrl = `${baseUrl}/unsubscribe/${contactId || relayToken}`

    // Replace placeholders in content
    const personalizedContent = htmlContent
      .replace(/\{\{recipient_name\}\}/g, recipientName)
      .replace(/\{\{sender_name\}\}/g, senderName)

    const relayMessage = campaign.relay_message || "Know someone who would love this? Share it with them!"

    // Build full email HTML with Substack-style formatting
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
    .content { padding: 20px 0; font-size: 16px; }
    .content h1 { font-size: 28px; font-weight: bold; margin-bottom: 16px; }
    .content h2 { font-size: 22px; font-weight: bold; margin-bottom: 12px; }
    .content p { margin-bottom: 16px; }
    .cta-button { display: inline-block; background: #3b82f6; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; font-family: -apple-system, sans-serif; }
    .relay-section { background: linear-gradient(to right, #f0f9ff, #e0f2fe, #f0f9ff); padding: 24px; border-radius: 12px; margin-top: 32px; text-align: center; }
    .relay-logo { font-weight: bold; color: #3b82f6; font-size: 16px; margin-bottom: 8px; font-family: -apple-system, sans-serif; }
    .relay-message { margin-bottom: 16px; font-size: 15px; }
    .relay-button { display: inline-block; background: #3b82f6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, sans-serif; }
    .footer { padding-top: 24px; margin-top: 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; font-family: -apple-system, sans-serif; }
    .unsubscribe { color: #6b7280; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="content">
    ${personalizedContent}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${eventUrl}" class="cta-button">${campaign.call_to_action || "Learn More"}</a>
    </div>
  </div>
  
  <div class="relay-section">
    <div class="relay-logo">Relay-it</div>
    <p class="relay-message">${relayMessage}</p>
    <a href="${relayPageUrl}" class="relay-button">Send this to a friend</a>
  </div>
  
  <div class="footer">
    <p>This email was sent by ${senderName} via Relay-it.</p>
    <p style="margin-top: 12px;"><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from these emails</a></p>
  </div>
</body>
</html>
`

    // Validate SMTP config is present
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return Response.json(
        { error: "SMTP credentials are not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables." },
        { status: 500 }
      )
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
      tls: {
        rejectUnauthorized: false,
      },
    })

    const fromName = process.env.SMTP_FROM_NAME || senderName || "Relay-it"
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    // Send email via SMTP
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: subject.replace(/\{\{recipient_name\}\}/g, recipientName),
      html: fullHtml,
      replyTo: senderEmail,
    })

    // Log the email in database (ignore errors if table doesn't exist)
    try {
      await supabase.from("email_logs").insert({
        campaign_id: campaignId,
        contact_id: contactId,
        email_type: isRelay ? "relay" : "initial",
        subject,
        sent_to: recipientEmail,
        sent_at: new Date().toISOString(),
        status: "sent",
        message_id: info.messageId,
      })
    } catch {
      // Email logs table may not exist, that's okay
    }

    // Mark contact as email sent
    if (contactId) {
      await supabase
        .from("contacts")
        .update({ email_sent: true })
        .eq("id", contactId)
    }

    return Response.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error sending email:", error)
    const message = error instanceof Error ? error.message : "Failed to send email"
    let friendlyMessage = message

    if (message.includes("535") || message.includes("Invalid login") || message.includes("5.7.8")) {
      friendlyMessage = "SMTP authentication failed (535). If using Gmail, you must use an App Password — go to Google Account > Security > 2-Step Verification > App Passwords and generate one, then update SMTP_PASS in your environment variables."
    } else if (message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT")) {
      friendlyMessage = "Cannot connect to SMTP server. Please check SMTP_HOST and SMTP_PORT environment variables."
    }

    return Response.json({ error: friendlyMessage }, { status: 500 })
  }
}
