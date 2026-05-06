import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { emailConfig } from "@/lib/smtp-config"

async function sendNotificationEmail(
  to: string,
  toName: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = emailConfig.apiKey

  if (!apiKey) {
    return { success: false, error: "SMTP_API_KEY not configured" }
  }

  const payload = {
    recipients: {
      to: [{ address: { email: to, name: toName } }],
    },
    originator: {
      from: {
        address: {
          email: emailConfig.senderEmail,
          name: emailConfig.senderName,
        },
      },
    },
    subject,
    body: {
      parts: [{ type: "text/html", content: html }],
    },
  }

  try {
    const response = await fetch("https://api.smtp.com/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, error: JSON.stringify(data) }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { campaignId, relayerName, relayerEmail, recipientName, recipientEmail } = body

    if (!campaignId || !relayerName || !relayerEmail || !recipientName || !recipientEmail) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role key so we can call auth.admin.getUserById
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch campaign and its owner profile
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, created_by")
      .eq("id", campaignId)
      .single()

    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get the campaign owner's full_name from profiles
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", campaign.created_by)
      .single()

    // Get the owner's email from auth.users via admin API (requires service role)
    const { data: { user: ownerUser } } = await supabase.auth.admin.getUserById(campaign.created_by)

    if (!ownerUser?.email) {
      // If we can't find the owner email, skip silently — not a hard failure
      return Response.json({ success: true, skipped: true })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const campaignUrl = `${baseUrl}/dashboard/campaigns/${campaignId}`

    const ownerDisplayName = ownerProfile?.full_name || ownerUser.email

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .card { background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #3b82f6; border-radius: 20px; padding: 4px 12px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; }
    h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    p { color: #475569; margin: 0 0 16px; font-size: 15px; }
    .relay-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0; }
    .relay-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px; font-size: 14px; }
    .relay-row:last-child { margin-bottom: 0; }
    .label { color: #94a3b8; font-weight: 500; min-width: 80px; }
    .value { color: #1e293b; font-weight: 600; }
    .cta { display: inline-block; background: #3b82f6; color: white !important; padding: 11px 22px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px; }
    .footer { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span>New Relay Activity</div>
    <h2>Someone just relayed your campaign!</h2>
    <p>Hi ${ownerDisplayName}, great news — <strong>${relayerName}</strong> just shared your <strong>${campaign.title}</strong> campaign with a new contact.</p>

    <div class="relay-box">
      <div class="relay-row">
        <span class="label">Shared by</span>
        <span class="value">${relayerName} &lt;${relayerEmail}&gt;</span>
      </div>
      <div class="relay-row">
        <span class="label">Sent to</span>
        <span class="value">${recipientName} &lt;${recipientEmail}&gt;</span>
      </div>
      <div class="relay-row">
        <span class="label">Campaign</span>
        <span class="value">${campaign.title}</span>
      </div>
    </div>

    <p>Your message is spreading! Keep the momentum going by checking your campaign dashboard.</p>
    <a href="${campaignUrl}" class="cta">View Campaign</a>

    <div class="footer">
      <p>You received this because you own the <strong>${campaign.title}</strong> campaign on Relay-it.</p>
    </div>
  </div>
</body>
</html>`

    const result = await sendNotificationEmail(
      ownerUser.email,
      ownerDisplayName,
      `New relay: ${relayerName} shared "${campaign.title}"`,
      html
    )

    if (!result.success) {
      console.error("[relay-notify] Failed to send notification:", result.error)
      // Return success anyway — notification failure shouldn't break the relay flow
      return Response.json({ success: true, notified: false, error: result.error })
    }

    return Response.json({ success: true, notified: true })
  } catch (error) {
    console.error("[relay-notify] Unexpected error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
