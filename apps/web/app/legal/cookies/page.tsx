import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { trackingPolicy } from '@/lib/legal-config'

export const metadata: Metadata = { title: 'Cookies', alternates: { canonical: '/legal/cookies' } }
export default function CookiesPage() { return <LegalPage title="Cookie policy" description="Current use of cookies and similar technologies on the Akademate public website." sections={[
  { title: 'Current use', content: <p>{trackingPolicy.statement}</p> },
  { title: 'Necessary technologies', content: <p>Authentication routes may use strictly necessary session cookies. The interface may also read a theme preference. These functions are not analytics or advertising.</p> },
  { title: 'Gate for future measurement', content: <p>{trackingPolicy.activationGate}</p> },
  { title: 'Browser controls', content: <p>Your browser can block or delete cookies. Disabling a strictly necessary cookie may prevent an authenticated session from working.</p> },
]} /> }
