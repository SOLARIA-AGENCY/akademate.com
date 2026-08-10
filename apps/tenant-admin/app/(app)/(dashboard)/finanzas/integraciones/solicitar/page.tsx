import Link from 'next/link'
import { ArrowLeft, GitPullRequest } from 'lucide-react'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import IntegrationRequestForm from './IntegrationRequestForm'

export default function RequestFinanceIntegrationPage() {
  return <div className="space-y-6"><PageHeader title="Request an integration" description="Start a scoped review for an accounting provider outside the native catalogue." icon={GitPullRequest} actions={<Button variant="ghost" asChild><Link href="/finanzas/integraciones"><ArrowLeft />Back to integrations</Link></Button>} /><IntegrationRequestForm /></div>
}
