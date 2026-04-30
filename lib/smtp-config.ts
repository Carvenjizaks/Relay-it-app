// SMTP.com configuration - uses env vars with sensible fallbacks
export const smtpConfig = {
  apiKey: process.env.SMTP_API_KEY || "",
  senderEmail: process.env.SMTP_SENDER_EMAIL || "nexiumbi@gmail.com",
  senderName: process.env.SMTP_SENDER_NAME || "Relay-it",
  channel: process.env.SMTP_CHANNEL || "",
}
