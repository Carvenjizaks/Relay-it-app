import { createClient } from "@/lib/supabase/server"
import { emailConfig } from "@/lib/smtp-config"
import { decrypt } from "@/lib/encryption"
import nodemailer from "nodemailer"

async function sendViaAgentMail(
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = emailConfig.apiKey
  const inboxId = emailConfig.inboxId

  if (!apiKey) {
    return { success: false, error: "AGENTMAIL_API_KEY not configured" }
  }

  if (!inboxId) {
    return { success: false, error: "AGENTMAIL_INBOX_ID not configured" }
  }

  const payload: Record<string, unknown> = {
    to,
    subject,
    html,
  }

  if (replyTo) {
    payload.reply_to = replyTo
  }

  console.log("[v0] Sending email via AgentMail:", JSON.stringify({ inboxId, to, subject: subject.substring(0, 50) }))

  try {
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
      return { success: false, error: JSON.stringify(data) }
    }

    return { success: true, messageId: data?.message_id || "sent" }
  } catch (error) {
    console.error("[v0] AgentMail API error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

async function sendViaSenderSmtp(
  to: { email: string; name: string },
  from: { email: string; name: string },
  subject: string,
  html: string,
  replyTo: string,
  senderIdentity: {
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password_encrypted: string
    smtp_secure: boolean
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const password = decrypt(senderIdentity.smtp_password_encrypted)
    const transporter = nodemailer.createTransport({
      host: senderIdentity.smtp_host,
      port: senderIdentity.smtp_port,
      secure: senderIdentity.smtp_secure,
      auth: {
        user: senderIdentity.smtp_username,
        pass: password,
      },
    })

    const info = await transporter.sendMail({
      from: `"${from.name}" <${from.email}>`,
      to: `"${to.name}" <${to.email}>`,
      replyTo,
      subject,
      html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[relay] Sender SMTP error:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

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
      isRelay,
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

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const relayPageUrl = `${baseUrl}/relay/${relayToken}`
    const unsubscribeUrl = `${baseUrl}/unsubscribe/${contactId || relayToken}`

    // Check if sender has a verified email identity (for relay sends)
    let senderIdentity = null
    if (isRelay && senderEmail) {
      const { data: identity } = await supabase
        .from("sender_identities")
        .select("*")
        .eq("email", senderEmail)
        .eq("is_verified", true)
        .maybeSingle()
      if (identity) senderIdentity = identity
    }

    // Replace placeholders
    const personalizedContent = htmlContent
      .replace(/\{\{recipient_name\}\}/g, recipientName)
      .replace(/\{\{sender_name\}\}/g, senderName)

    // Determine sender display
    const fromName = senderIdentity
      ? `${senderName}`
      : senderName || emailConfig.senderName || "Relay-it"
    const fromEmail = senderIdentity ? senderIdentity.email : emailConfig.senderEmail

    // Build personal-share style email HTML
    const relayMessage = campaign.relay_message || "Know someone who would love this? Share it with them!"

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .email-card { background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .sender-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
    .sender-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6, #f59e0b); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; }
    .sender-info { flex: 1; }
    .sender-name { font-weight: 600; color: #1e293b; font-size: 15px; }
    .sender-meta { color: #64748b; font-size: 13px; }
    .personal-note { background: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 20px; font-style: italic; color: #475569; }
    .content { font-size: 15px; color: #334155; }
    .content p { margin-bottom: 14px; }
    .cta-button { display: inline-block; background: #3b82f6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .relay-section { background: linear-gradient(to right, #eff6ff, #fff7ed); padding: 20px; border-radius: 10px; margin-top: 24px; text-align: center; border: 1px solid #dbeafe; }
    .relay-button { display: inline-block; background: #3b82f6; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; margin-top: 8px; }
    .footer { padding-top: 20px; margin-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    .footer a { color: #64748b; text-decoration: underline; }
    .badge { display: inline-block; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 6px; }
  </style>
</head>
<body>
  <div class="email-card">
    <!-- Sender Header -->
    <div class="sender-header">
      <div class="sender-avatar">${senderName.charAt(0).toUpperCase()}</div>
      <div class="sender-info">
        <div class="sender-name">${senderName} <span class="badge">shared via Relay-it</span></div>
        <div class="sender-meta">${senderEmail}</div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      ${personalizedContent}
      
      <div style="text-align: center;">
        <a href="${eventUrl}" class="cta-button">${campaign.call_to_action || "Learn More"}</a>
      </div>
    </div>

    <!-- Relay Section -->
    <div class="relay-section">
      <p style="margin: 0 0 8px; font-weight: 600; color: #1e40af;">Know someone who would benefit?</p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">${relayMessage}</p>
      <a href="${relayPageUrl}" class="relay-button">Share with a friend</a>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This message was shared by ${senderName} using Relay-it.</p>
      <p style="margin-top: 8px;">Reply to this email to reach ${senderName} directly.</p>
      <p style="margin-top: 8px;"><a href="${unsubscribeUrl}">Unsubscribe from these emails</a></p>
    </div>
  </div>
</body>
</html>`

    const finalSubject = subject.replace(/\{\{recipient_name\}\}/g, recipientName)

    let result
    if (senderIdentity) {
      // Send via sender's own SMTP — truly from them
      result = await sendViaSenderSmtp(
        { email: recipientEmail, name: recipientName },
        { email: fromEmail, name: fromName },
        finalSubject,
        fullHtml,
        senderEmail,
        senderIdentity
      )
      // If sender SMTP fails, fall back to system
      if (!result.success) {
        console.warn("[relay] Sender SMTP failed, falling back to AgentMail:", result.error)
        result = await sendViaAgentMail(
          recipientEmail,
          finalSubject,
          fullHtml,
          senderEmail
        )
      }
    } else {
      // System email via AgentMail
      result = await sendViaAgentMail(
        recipientEmail,
        finalSubject,
        fullHtml,
        senderEmail
      )
    }

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 })
    }

    // Mark contact as email sent
    if (contactId) {
      await supabase
        .from("contacts")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("id", contactId)
    }

    return Response.json({ success: true, messageId: result.messageId, sentVia: senderIdentity ? "sender_smtp" : "agentmail" })
  } catch (error) {
    console.error("[relay] Error sending email:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
