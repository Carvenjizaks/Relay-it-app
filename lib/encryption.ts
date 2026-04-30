import crypto from "crypto"

const ENCRYPTION_KEY = process.env.SMTP_PASSWORD_ENCRYPTION_KEY || "relay-it-default-key-32chars-long!"

function getKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex")
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}
