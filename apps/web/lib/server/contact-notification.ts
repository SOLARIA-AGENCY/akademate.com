import { createHash } from 'node:crypto'

type ContactLead = {
  kind: 'contact'
  firstName: string
  lastName: string
  email: string
  phone: string
  subject: 'demo' | 'pricing' | 'support' | 'partnership' | 'privacy' | 'other'
  message: string
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

type WaitlistLead = {
  kind: 'waitlist'
  email: string
}

export type PublicNotification = ContactLead | WaitlistLead

const subjectLabels: Record<ContactLead['subject'], string> = {
  demo: 'Demo request',
  pricing: 'Plans and commercial scope',
  support: 'Customer support',
  partnership: 'Enterprise or partnership',
  privacy: 'Privacy enquiry',
  other: 'General enquiry',
}

export async function sendPublicNotification(notification: PublicNotification) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const recipient = process.env.CONTACT_NOTIFICATION_TO?.trim()
  const from = process.env.CONTACT_FROM_EMAIL?.trim()

  if (!apiKey || !recipient || !from) {
    throw new Error('Contact notification service is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': createIdempotencyKey(notification),
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: notification.email,
      subject: notification.kind === 'waitlist'
        ? '[Akademate] New early-access request'
        : `[Akademate] ${subjectLabels[notification.subject]}`,
      text: renderPlainText(notification),
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error('Contact notification provider rejected the request')
  }
}

function createIdempotencyKey(notification: PublicNotification) {
  const utcDay = new Date().toISOString().slice(0, 10)
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(notification))
    .digest('hex')
    .slice(0, 32)
  return `akademate-public-${utcDay}-${fingerprint}`
}

function renderPlainText(notification: PublicNotification) {
  if (notification.kind === 'waitlist') {
    return `New Akademate early-access request\n\nEmail: ${notification.email}`
  }

  const utm = notification.utm
  const campaignContext = utm
    ? [
        ['Source', utm.source],
        ['Medium', utm.medium],
        ['Campaign', utm.campaign],
        ['Term', utm.term],
        ['Content', utm.content],
      ].filter((entry) => entry[1]).map(([label, value]) => `${label}: ${value}`)
    : []

  return [
    'New Akademate website enquiry',
    '',
    `Topic: ${subjectLabels[notification.subject]}`,
    `Name: ${[notification.firstName, notification.lastName].filter(Boolean).join(' ')}`,
    `Email: ${notification.email}`,
    `Phone: ${notification.phone || 'Not provided'}`,
    '',
    'Message:',
    notification.message,
    ...(campaignContext.length ? ['', 'Campaign context:', ...campaignContext] : []),
  ].join('\n')
}
