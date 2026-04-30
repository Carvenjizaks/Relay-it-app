// SMTP.com configuration - uses env vars with sensible fallbacks
export const emailConfig = {
  apiKey: process.env.SMTP_API_KEY || "54ec36bc8e0be9a0935ee74e46c5b60b8b30d5b1",
  senderEmail: process.env.SMTP_SENDER_EMAIL || "noreply@relay-it.app",
  senderName: process.env.SMTP_SENDER_NAME || "Relay-The Message",
  channel: process.env.SMTP_CHANNEL || "",
}

// Keep backwards compatible export
export const smtpConfig = emailConfig
