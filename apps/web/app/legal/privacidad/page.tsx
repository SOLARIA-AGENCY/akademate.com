import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { legalCompany } from '@/lib/legal-config'

export const metadata: Metadata = { title: 'Privacy', alternates: { canonical: '/legal/privacidad' } }
export default function PrivacyPage() { return <LegalPage title="Privacy policy" description="Information about personal data associated with the Akademate corporate website and service." sections={[
  { title: 'Who processes data', content: <p>{legalCompany.name} acts as controller for its website, commercial relationship, billing and security. For data an academy enters into Akademate, controller and processor responsibilities depend on the relevant processing activity and contract.</p> },
  { title: 'Data and purposes', content: <p>The website may receive contact details and context supplied with an enquiry. The service may process account, academic-operation, billing and security data for the purposes agreed with the organisation. Customer data is not described here as training data for general-purpose models.</p> },
  { title: 'Legal bases and retention', content: <p>Applicable bases and retention periods must be determined for each activity, including consent, pre-contractual steps, contract, legal obligation or an assessed legitimate interest.</p> },
  { title: 'Rights and contact', content: <p>Requests about data managed by an academy should normally be directed to that organisation. Until a dedicated privacy channel is validated, enquiries for SOLARIA may be sent to hola@akademate.com.</p> },
]} /> }
