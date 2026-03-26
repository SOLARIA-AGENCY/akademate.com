/**
 * Email Transporter — Akademate Mail System
 *
 * Production: sends directly to recipient MX with DKIM signing (port 25 open on Hetzner).
 * Development: sends to local Mailpit for capture/testing.
 *
 * Env vars:
 *   SMTP_HOST       — Override SMTP server (default: direct MX delivery in prod, localhost in dev)
 *   SMTP_PORT       — Override port (default: 25 prod, 1025 dev)
 *   SMTP_FROM       — Default sender
 *   DKIM_PRIVATE_KEY — DKIM private key (PEM format, base64 encoded or file path)
 *   DKIM_SELECTOR   — DKIM selector (default: akademate)
 *   DKIM_DOMAIN     — DKIM domain (default: cepcomunicacion.com)
 */

import nodemailer from 'nodemailer'
import fs from 'fs'

// DKIM configuration
const DKIM_SELECTOR = process.env.DKIM_SELECTOR || 'akademate'
const DKIM_DOMAIN = process.env.DKIM_DOMAIN || 'cepcomunicacion.com'

function getDkimKey(): string | null {
  // Try env var first
  if (process.env.DKIM_PRIVATE_KEY) return process.env.DKIM_PRIVATE_KEY

  // Try file path (Docker volume mount)
  const keyPaths = [
    process.env.DKIM_PRIVATE_KEY_PATH || '',
    '/app/dkim/cepcomunicacion.key',
    '/opt/akademate/mail/dkim/cepcomunicacion.key',
    './dkim/cepcomunicacion.key',
  ].filter(Boolean)
  for (const p of keyPaths) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8')
    } catch { /* continue */ }
  }
  return null
}

// In production, send directly to MX with DKIM
// In development, use Mailpit
const isProduction = process.env.NODE_ENV === 'production'

const transportConfig = isProduction
  ? {
      host: process.env.SMTP_HOST || 'akademate-mail',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      tls: { rejectUnauthorized: false },
      // Force IPv4 to avoid Gmail IPv6 PTR issues
      family: 4 as const,
    }
  : {
      host: 'localhost',
      port: 1025,
      secure: false,
      tls: { rejectUnauthorized: false },
    }

const dkimKey = getDkimKey()
const dkimConfig = dkimKey
  ? {
      dkim: {
        domainName: DKIM_DOMAIN,
        keySelector: DKIM_SELECTOR,
        privateKey: dkimKey,
      },
    }
  : {}

const transporter = nodemailer.createTransport({
  ...transportConfig,
  ...dkimConfig,
} as any)

const DEFAULT_FROM = process.env.SMTP_FROM || `CEP Formacion <noreply@cepcomunicacion.com>`

export interface SendMailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: options.from || DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || 'info@cepcomunicacion.com',
    })
    console.log(`[email] Sent to ${options.to}: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[email] Failed to send to ${options.to}:`, msg)
    return { success: false, error: msg }
  }
}

export { transporter }
