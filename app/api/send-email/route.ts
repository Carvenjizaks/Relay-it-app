import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

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
      relayToken
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

    // Replace placeholders in content
    const personalizedContent = htmlContent
      .replace(/\{\{recipient_name\}\}/g, recipientName)
      .replace(/\{\{sender_name\}\}/g, senderName)

    // Build full email HTML
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
    .content { padding: 30px 0; }
    .cta-button { display: inline-block; background: #0070f3; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #0060df; }
    .relay-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 24px; border-radius: 12px; margin-top: 30px; border: 1px solid #dee2e6; }
    .relay-section h3 { margin-top: 0; color: #495057; }
    .relay-button { display: inline-block; background: #28a745; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { padding-top: 30px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; color: #333;">${campaign.name}</h1>
  </div>
  
  <div class="content">
    ${personalizedContent}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${eventUrl}" class="cta-button">${campaign.cta_text || "Learn More"}</a>
    </div>
  </div>
  
  <div class="relay-section">
    <h3>Know Someone Who Would Benefit?</h3>
    <p>Share this opportunity with a friend or colleague. Enter their details, and we'll send them a personalized invitation on your behalf.</p>
    <div style="text-align: center;">
      <a href="${relayPageUrl}" class="relay-button">Share This Opportunity</a>
    </div>
  </div>
  
  <div class="footer">
    <p>This email was sent by ${senderName} via Relay-it.</p>
    <p>Event/Campaign URL: <a href="${eventUrl}">${eventUrl}</a></p>
  </div>
</body>
</html>
`

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Relay-it <onboarding@resend.dev>",
      to: recipientEmail,
      subject: subject.replace(/\{\{recipient_name\}\}/g, recipientName),
      html: fullHtml,
      replyTo: senderEmail,
    })

    if (error) {
      console.error("Resend error:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Log the email in database
    await supabase.from("email_logs").insert({
      campaign_id: campaignId,
      contact_id: body.contactId,
      email_type: body.isRelay ? "relay" : "initial",
      subject,
      sent_to: recipientEmail,
      sent_at: new Date().toISOString(),
      status: "sent",
      resend_id: data?.id,
    })

    return Response.json({ success: true, emailId: data?.id })
  } catch (error) {
    console.error("Error sending email:", error)
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
