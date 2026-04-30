// AgentMail configuration - uses env vars with sensible fallbacks
export const emailConfig = {
  apiKey: process.env.AGENTMAIL_API_KEY || "",
  inboxId: process.env.AGENTMAIL_INBOX_ID || "carvenjiz",
  senderEmail: process.env.AGENTMAIL_SENDER_EMAIL || "carvenjiz@agentmail.to",
  senderName: process.env.AGENTMAIL_SENDER_NAME || "Relay-The Message",
}

// Keep backwards compatible export
export const smtpConfig = emailConfig
