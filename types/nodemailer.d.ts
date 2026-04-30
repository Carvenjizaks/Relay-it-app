declare module "nodemailer" {
  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>
    verify(): Promise<boolean>
  }

  export interface SendMailOptions {
    from?: string
    to?: string
    replyTo?: string
    subject?: string
    html?: string
    text?: string
  }

  export interface SentMessageInfo {
    messageId: string
    envelope: unknown
    accepted: string[]
    rejected: string[]
    pending: string[]
    response: string
  }

  export function createTransport(options: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }): Transporter
}
