// SMTP.com configuration
// Uses env vars if set, otherwise falls back to defaults
export const smtpConfig = {
  apiKey: process.env.SMTP_API_KEY || "3e9b0f146f3f71295f4d3022a4759d8078e4e475",
  channel: process.env.SMTP_CHANNEL !== "qamfaj-Hatku2-ciqpux" 
    ? (process.env.SMTP_CHANNEL || "RelayApp_Channel") 
    : "RelayApp_Channel",
  senderEmail: process.env.SMTP_SENDER_EMAIL || "nexiumbi@gmail.com",
  senderName: process.env.SMTP_SENDER_NAME || "Relay-it",
}
