import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Subprocessors and providers', alternates: { canonical: '/legal/subencargados' } }
export default function SubprocessorsPage() { return <LegalPage title="Subprocessors and providers" description="Information about provider categories that may support delivery of Akademate." sections={[
  { title: 'Provider inventory', content: <p>The contractual list of providers, locations, transfers and functions is being validated before final publication. A dependency in source code does not by itself establish that a provider processes customer data.</p> },
  { title: 'Provider categories', content: <p>Depending on the contracted configuration, providers may support hosting, network security, storage, email, support, observability, payments or artificial intelligence.</p> },
  { title: 'Changes and safeguards', content: <p>Where a provider processes data for a customer, its function, location and safeguards should appear in the applicable contract or annex together with the agreed change-notification mechanism.</p> },
  { title: 'Requesting information', content: <p>Customers may request the current contractual inventory through their Akademate relationship channel.</p> },
]} /> }
