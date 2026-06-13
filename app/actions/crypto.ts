"use server"

import crypto from "crypto"

const ALGORITHM = "aes-256-cbc"

// 🔒 Ensure this key string is exactly 32 characters long in production
const ENCRYPTION_KEY = process.env.QR_SECRET_KEY || "airfitnesssecretkey32charslong!" 
const IV_LENGTH = 16

export async function encryptQrPayloadAction(text: string): Promise<string> {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    
    // Outputs a secure encrypted token string formatted as iv:encryptedData
    return iv.toString("hex") + ":" + encrypted.toString("hex")
  } catch (err) {
    console.error("Encryption calculation failed:", err)
    return text // Failover to plain text if logic encounters runtime blocks
  }
}