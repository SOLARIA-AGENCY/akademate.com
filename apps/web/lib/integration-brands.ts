export type ConnectorStatus = 'Available' | 'Connector-ready' | 'Roadmap' | 'Payment method'

export const integrationBrands = {
  stripe: { label: 'Stripe', asset: '/brands/stripe.svg', color: '#635BFF', status: 'Available' },
  paypal: {
    label: 'PayPal',
    asset: '/brands/paypal.svg',
    color: '#003087',
    status: 'Connector-ready',
  },
  sepa: {
    label: 'SEPA',
    asset: '/brands/sepa.svg',
    color: '#003399',
    status: 'Connector-ready',
    preserveColor: true,
  },
  visa: { label: 'Visa', asset: '/brands/visa.svg', color: '#1A1F71', status: 'Payment method' },
  mastercard: {
    label: 'Mastercard',
    asset: '/brands/mastercard.svg',
    color: '#EB001B',
    status: 'Payment method',
  },
  applepay: {
    label: 'Apple Pay',
    asset: '/brands/applepay.svg',
    color: '#111827',
    status: 'Payment method',
  },
  googlepay: {
    label: 'Google Pay',
    asset: '/brands/googlepay.svg',
    color: '#4285F4',
    status: 'Payment method',
  },
  meta: { label: 'Meta', asset: '/brands/meta.svg', color: '#0866FF', status: 'Connector-ready' },
  googleads: {
    label: 'Google Ads',
    asset: '/brands/googleads.svg',
    color: '#4285F4',
    status: 'Connector-ready',
  },
  cloudflare: {
    label: 'Cloudflare',
    asset: '/brands/cloudflare.svg',
    color: '#F38020',
    status: 'Available',
  },
  googlecalendar: {
    label: 'Google Calendar',
    asset: '/brands/googlecalendar.svg',
    color: '#4285F4',
    status: 'Connector-ready',
  },
  zoom: { label: 'Zoom', asset: '/brands/zoom.svg', color: '#0B5CFF', status: 'Connector-ready' },
  googlemeet: {
    label: 'Google Meet',
    asset: '/brands/googlemeet.svg',
    color: '#00897B',
    status: 'Connector-ready',
  },
  youtube: {
    label: 'YouTube',
    asset: '/brands/youtube.svg',
    color: '#FF0000',
    status: 'Connector-ready',
  },
  vimeo: {
    label: 'Vimeo',
    asset: '/brands/vimeo.svg',
    color: '#1AB7EA',
    status: 'Connector-ready',
  },
  whatsapp: {
    label: 'WhatsApp',
    asset: '/brands/whatsapp.svg',
    color: '#25D366',
    status: 'Roadmap',
  },
  twilio: { label: 'Twilio', asset: '/brands/twilio.svg', color: '#F22F46', status: 'Roadmap' },
  xero: { label: 'Xero', asset: '/brands/xero.svg', color: '#13B5EA', status: 'Roadmap' },
  quickbooks: {
    label: 'QuickBooks',
    asset: '/brands/quickbooks.svg',
    color: '#2CA01C',
    status: 'Roadmap',
  },
  sage: { label: 'Sage', asset: '/brands/sage.svg', color: '#00D639', status: 'Roadmap' },
  openai: { label: 'OpenAI', asset: '/brands/openai.svg', color: '#111827', status: 'Roadmap' },
  okta: { label: 'Okta', asset: '/brands/okta.svg', color: '#007DC1', status: 'Roadmap' },
  auth0: { label: 'Auth0', asset: '/brands/auth0.svg', color: '#EB5424', status: 'Roadmap' },
  zapier: {
    label: 'Zapier',
    asset: '/brands/zapier.svg',
    color: '#FF4F00',
    status: 'Connector-ready',
  },
  make: { label: 'Make', asset: '/brands/make.svg', color: '#6D00CC', status: 'Connector-ready' },
  n8n: { label: 'n8n', asset: '/brands/n8n.svg', color: '#EA4B71', status: 'Connector-ready' },
} as const

export type IntegrationBrandId = keyof typeof integrationBrands

export const homeIntegrationBrands: IntegrationBrandId[] = [
  'stripe',
  'paypal',
  'sepa',
  'meta',
  'googleads',
  'zoom',
  'cloudflare',
  'zapier',
]

export const integrationPillarBrands: Record<string, IntegrationBrandId[]> = {
  Payments: ['stripe', 'paypal', 'sepa', 'visa', 'mastercard', 'applepay', 'googlepay'],
  Finance: ['xero', 'quickbooks', 'sage'],
  Growth: ['meta', 'googleads'],
  Communication: ['whatsapp', 'twilio'],
}
