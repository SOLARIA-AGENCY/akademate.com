type ContactLead = {
  kind: 'contact'
  firstName: string
  lastName: string
  email: string
  phone: string
  subject: 'demo' | 'pricing' | 'support' | 'partnership' | 'privacy' | 'trial' | 'other'
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
  trial: 'Free trial request',
  other: 'General enquiry',
}

export async function sendPublicNotification(notification: PublicNotification) {
  const mailerUrl = process.env.CONTACT_MAILER_URL?.trim()
  const mailerToken = process.env.CONTACT_MAILER_TOKEN?.trim()

  if (!mailerUrl || !mailerToken) {
    throw new Error('Contact notification service is not configured')
  }

  const response = await fetch(mailerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mailerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: notification.kind,
      replyTo: notification.email,
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
