import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Terms of use', alternates: { canonical: '/legal/terminos' } }
export default function TermsPage() { return <LegalPage title="Terms of use" description="Information governing access to this website and the relationship between public product information and a service agreement." sections={[
  { title: 'Website and service agreements', content: <p>akademate.com describes Akademate and its Business and Enterprise plans. Modules, deployment, support, availability, price, limits, integrations and responsibilities become binding only through the applicable proposal or contract.</p> },
  { title: 'Authorised use', content: <p>You must not interfere with security, access another organisation’s data, abuse forms or use the service for unlawful purposes. Credentials must be protected.</p> },
  { title: 'Availability and changes', content: <p>Website information may be updated as the product and commercial offering evolve. Service-level commitments, where applicable, belong in the relevant agreement.</p> },
  { title: 'Ownership and responsibility', content: <p>Akademate and its components are subject to applicable intellectual-property rights. Each customer retains its rights and responsibilities concerning its data. Contractual liability terms require legal review and agreement.</p> },
]} /> }
