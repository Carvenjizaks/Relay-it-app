import { smtpConfig } from "@/lib/smtp-config"

export type EmailRecipient = {
  email: string
  name?: string
}

export type EmailSender = {
  email?: string
  name?: string
}

export async function sendViaSmtpApi({
  to,
  from,
  subject,
  html,
  replyTo,
}: {
  to: EmailRecipient
  from?: EmailSender
  subject: string
  html: string
  replyTo?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = smtpConfig.apiKey

  if (!apiKey) {
    return { success: false, error: "SMTP_API_KEY not configured" }
  }

  const fromEmail = from?.email || smtpConfig.senderEmail
  const fromName = from?.name || smtpConfig.senderName || "Relay-it"

  if (!fromEmail) {
    return { success: false, error: "SMTP_SENDER_EMAIL not configured" }
  }

  const payload: Record<string, unknown> = {
    recipients: {
      to: [{ address: { email: to.email, name: to.name || to.email } }],
    },
    originator: {
      from: { address: { email: fromEmail, name: fromName } },
    },
    subject,
    body: {
      parts: [{ type: "text/html", content: html }],
    },
  }

  if (replyTo && replyTo.includes("@")) {
    ;(payload.originator as Record<string, unknown>).reply_to = [
      { address: { email: replyTo } },
    ]
  }

  const response = await fetch("https://api.smtp.com/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  let data: any = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    return {
      success: false,
      error: JSON.stringify(data?.data || data || { status: response.status }),
    }
  }

  return { success: true, messageId: data?.data?.message_id || "sent" }
}
