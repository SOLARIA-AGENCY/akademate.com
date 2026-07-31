import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'AI transparency', alternates: { canonical: '/legal/ia' } }
export default function AiTransparencyPage() { return <LegalPage title="AI transparency" description="How AI-assisted tools, human oversight and data boundaries are approached in Akademate." sections={[
  { title: 'AI-assisted operations', content: <p>Akademate can connect AI-assisted tools to operational workflows through governed interfaces, including MCP. Available tools, providers, credentials and accessible data are determined by the organisation’s deployment and authorisation model.</p> },
  { title: 'Human oversight', content: <p>AI output can be incomplete or inaccurate. Meaningful educational, legal, financial or high-impact decisions require appropriate human review.</p> },
  { title: 'Data and permissions', content: <p>Each integration must remain within the authorised organisation, role, resource and purpose. External providers require the relevant contractual, data-flow and configuration review.</p> },
  { title: 'Frameworks shaping our approach', content: <p>Our governance roadmap draws on GDPR, the EU AI Act, ISO 27001, SOC 2 and modern application security practices. Evidence for completed certifications or independent audits will be published in this trust centre as it becomes available.</p> },
]} /> }
