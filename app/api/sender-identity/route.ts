import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.SMTP_PASSWORD_ENCRYPTION_KEY || "relay-it-default-key-32chars-long!"

function getKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      contactId,
      email,
      displayName,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpSecure,
    } = body

    if (!contactId || !email || !smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validate SMTP by attempting to create a transporter (we don't send, just verify auth)
    try {
      const nodemailer = await import("nodemailer")
      const transporter = nodemailer.createTransporter({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Boolean(smtpSecure),
        auth: {
          user: smtpUsername,
          pass: smtpPassword,
        },
      })
      await transporter.verify()
    } catch (verifyError) {
      return NextResponse.json(
        { error: "SMTP verification failed. Check your credentials.", details: verifyError instanceof Error ? verifyError.message : String(verifyError) },
        { status: 400 }
      )
    }

    const encryptedPassword = encrypt(smtpPassword)

    const { data, error } = await supabase.from("sender_identities").upsert(
      {
        contact_id: contactId,
        email,
        display_name: displayName || null,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_username: smtpUsername,
        smtp_password_encrypted: encryptedPassword,
        smtp_secure: Boolean(smtpSecure),
        is_verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "contact_id,email" }
    )

    if (error) {
      console.error("[sender-identity] Upsert error:", error)
      return NextResponse.json({ error: "Failed to save sender identity" }, { status: 500 })
    }

    return NextResponse.json({ success: true, email, isVerified: true })
  } catch (error) {
    console.error("[sender-identity] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save sender identity" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const contactId = searchParams.get("contactId")
    const email = searchParams.get("email")

    if (!contactId || !email) {
      return NextResponse.json({ error: "contactId and email required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sender_identities")
      .select("email, display_name, is_verified, smtp_host, smtp_port, smtp_secure")
      .eq("contact_id", contactId)
      .eq("email", email)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: "Failed to fetch identity" }, { status: 500 })
    }

    return NextResponse.json({ identity: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch identity" },
      { status: 500 }
    )
  }
}
