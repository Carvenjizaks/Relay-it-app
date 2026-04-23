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

    // Validate API key
    const apiKey = process.env.SMTP_PASS
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const fromName = process.env.SMTP_FROM_NAME || senderName || "Relay-it"
    const channelName = process.env.SMTP_CHANNEL || "thefatherhoofoundation"

    if (!apiKey || !fromEmail) {
      return Response.json(
        { error: "Email credentials not configured. Please set SMTP_PASS (API key) and SMTP_FROM_EMAIL." },
        { status: 500 }
      )
    }

    const finalSubject = subject.replace(/\{\{recipient_name\}\}/g, recipientName)

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
          to: [{ address: { email: recipientEmail, name: recipientName } }],
        },
        originator: {
          from: { address: { email: fromEmail, name: fromName } },
          reply_to: senderEmail ? [{ address: { email: senderEmail } }] : undefined,
        },
        subject: finalSubject,
        body: {
          parts: [{ type: "text/html", content: fullHtml }],
        },
      }),
    })

    const smtpData = await smtpRes.json()

    if (!smtpRes.ok) {
      const errMsg = smtpData?.data?.message || smtpData?.message || JSON.stringify(smtpData)
      console.error("SMTP.com API error:", errMsg)
      return Response.json({ error: `Email send failed: ${errMsg}` }, { status: 500 })
    }

    // Mark contact as email sent
    if (contactId) {
      await supabase
        .from("contacts")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("id", contactId)
    }

    return Response.json({ success: true, messageId: smtpData?.data?.id || "sent" })
  } catch (error) {
    console.error("Error sending email:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
