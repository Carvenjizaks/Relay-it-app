import nodemailer from 'nodemailer'

// SMTP Configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'send.smtp.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}

const fromEmail = process.env.SMTP_FROM || 'noreply@yourdomain.com'
const fromName = process.env.SMTP_FROM_NAME || 'Relay App'

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig)

// Verify connection on startup
transporter.verify(function (error) {
  if (error) {
    console.log('SMTP Connection Error:', error)
  } else {
    console.log('SMTP Server is ready to send emails')
  }
})

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail(data: EmailData) {
  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Email Templates

export function registrationConfirmationEmail(
  userName: string,
  eventName: string,
  eventDate?: string,
  eventLocation?: string,
  referralCode?: string
) {
  const dateStr = eventDate ? new Date(eventDate).toLocaleDateString() : 'TBA'
  const locationStr = eventLocation || 'TBA'

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">You're Registered! 🎉</h1>
      <p>Hi ${userName},</p>
      <p>You're all set for <strong>${eventName}</strong>.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Location:</strong> ${locationStr}</p>
      </div>
      
      ${referralCode ? `
      <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #6366f1; margin-top: 0;">Invite Friends & Earn Rewards! 🎁</h3>
        <p>Share your referral code and earn credits:</p>
        <div style="background: white; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #6366f1;">
          ${referralCode}
        </div>
        <p style="font-size: 14px; color: #64748b;">You'll earn credits when friends register using your code!</p>
      </div>
      ` : ''}
      
      <p>See you there!</p>
      <p style="color: #64748b;">— The Relay Team</p>
    </div>
  `

  const text = `
You're Registered! 🎉

Hi ${userName},

You're all set for ${eventName}.

Event: ${eventName}
Date: ${dateStr}
Location: ${locationStr}

${referralCode ? `
Invite Friends & Earn Rewards! 🎁
Share your referral code: ${referralCode}
You'll earn credits when friends register using your code!
` : ''}

See you there!
— The Relay Team
  `

  return { html, text }
}

export function referralNotificationEmail(
  referrerName: string,
  referredName: string,
  eventName: string,
  creditsEarned: number
) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">New Referral! 🎉</h1>
      <p>Hi ${referrerName},</p>
      <p>Great news! <strong>${referredName}</strong> just registered for <strong>${eventName}</strong> using your referral code.</p>
      
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 18px;">You earned</p>
        <p style="margin: 10px 0; font-size: 48px; font-weight: bold; color: #10b981;">${creditsEarned} Credits</p>
      </div>
      
      <p>Keep sharing to earn more rewards!</p>
      <p style="color: #64748b;">— The Relay Team</p>
    </div>
  `

  const text = `
New Referral! 🎉

Hi ${referrerName},

Great news! ${referredName} just registered for ${eventName} using your referral code.

You earned ${creditsEarned} Credits!

Keep sharing to earn more rewards!
— The Relay Team
  `

  return { html, text }
}

export function perkClaimedEmail(
  userName: string,
  perkName: string,
  eventName: string,
  creditsSpent: number
) {
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Perk Claimed! 🎁</h1>
      <p>Hi ${userName},</p>
      <p>You've successfully claimed <strong>${perkName}</strong> for <strong>${eventName}</strong>.</p>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 18px;">Credits spent</p>
        <p style="margin: 10px 0; font-size: 36px; font-weight: bold; color: #f59e0b;">${creditsSpent}</p>
      </div>
      
      <p>Your perk will be available at the event. Show this email at check-in!</p>
      <p style="color: #64748b;">— The Relay Team</p>
    </div>
  `

  const text = `
Perk Claimed! 🎁

Hi ${userName},

You've successfully claimed ${perkName} for ${eventName}.

Credits spent: ${creditsSpent}

Your perk will be available at the event. Show this email at check-in!
— The Relay Team
  `

  return { html, text }
}
