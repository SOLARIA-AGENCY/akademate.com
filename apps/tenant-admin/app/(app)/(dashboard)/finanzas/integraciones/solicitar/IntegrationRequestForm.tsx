'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

const capabilityOptions = ['accounts', 'taxes', 'contacts', 'invoices', 'expenses', 'payments', 'banking', 'payroll', 'reports'] as const

export default function IntegrationRequestForm() {
  const [capabilities, setCapabilities] = useState<string[]>(['accounts', 'invoices'])
  const [writebackRequested, setWritebackRequested] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ id: string } | { error: string } | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setResult(null)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/next/finance/integration-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: form.get('providerName'), providerWebsite: form.get('providerWebsite'), apiDocumentationUrl: form.get('apiDocumentationUrl') || null,
          countryCode: form.get('countryCode'), currency: form.get('currency'), legalEntityCount: Number(form.get('legalEntityCount')), campusCount: Number(form.get('campusCount')),
          monthlyTransactionBand: form.get('monthlyTransactionBand'), capabilities, writebackRequested, sandboxKnown: form.get('sandboxKnown'), urgency: form.get('urgency'), context: form.get('context'),
        }),
      })
      const payload = await response.json() as { id?: string; error?: string }
      if (!response.ok || !payload.id) { setResult({ error: payload.error ?? 'Request could not be submitted.' }); return }
      setResult({ id: payload.id })
      event.currentTarget.reset()
    } catch { setResult({ error: 'Request could not be submitted.' }) } finally { setSubmitting(false) }
  }

  function toggleCapability(capability: string) {
    setCapabilities((current) => current.includes(capability) ? current.filter((item) => item !== capability) : [...current, capability])
  }

  return <Card><CardHeader><CardTitle>Request an accounting integration</CardTitle><CardDescription>Tell us about the provider and the academy workflow. This creates a review request; it does not promise feasibility, delivery date or price.</CardDescription></CardHeader><CardContent>
    {result && ('id' in result ? <Alert className="mb-6 border-emerald-300"><CheckCircle2 className="h-4 w-4" /><AlertTitle>Request received</AlertTitle><AlertDescription>Reference: <code>{result.id}</code>. The request is now visible in your tenant timeline.</AlertDescription></Alert> : <Alert variant="destructive" className="mb-6"><AlertTitle>Could not submit</AlertTitle><AlertDescription>{result.error}</AlertDescription></Alert>)}
    <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-medium">Provider name<input required name="providerName" className="h-10 rounded-md border bg-background px-3 font-normal" placeholder="Example Books" /></label>
      <label className="grid gap-2 text-sm font-medium">Provider website<input required type="url" name="providerWebsite" className="h-10 rounded-md border bg-background px-3 font-normal" placeholder="https://provider.example" /></label>
      <label className="grid gap-2 text-sm font-medium">API documentation (optional)<input type="url" name="apiDocumentationUrl" className="h-10 rounded-md border bg-background px-3 font-normal" placeholder="https://docs.provider.example" /></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-2 text-sm font-medium">Country<input required name="countryCode" defaultValue="ES" maxLength={2} className="h-10 rounded-md border bg-background px-3 uppercase" /></label><label className="grid gap-2 text-sm font-medium">Currency<input required name="currency" defaultValue="EUR" maxLength={3} className="h-10 rounded-md border bg-background px-3 uppercase" /></label></div>
      <label className="grid gap-2 text-sm font-medium">Legal entities<input required type="number" min={1} name="legalEntityCount" defaultValue={1} className="h-10 rounded-md border bg-background px-3 font-normal" /></label>
      <label className="grid gap-2 text-sm font-medium">Campuses or sites<input required type="number" min={1} name="campusCount" defaultValue={1} className="h-10 rounded-md border bg-background px-3 font-normal" /></label>
      <label className="grid gap-2 text-sm font-medium">Monthly transaction band<select name="monthlyTransactionBand" defaultValue="100_999" className="h-10 rounded-md border bg-background px-3 font-normal"><option value="under_100">Under 100</option><option value="100_999">100–999</option><option value="1000_9999">1,000–9,999</option><option value="10000_plus">10,000+</option></select></label>
      <label className="grid gap-2 text-sm font-medium">Sandbox available<select name="sandboxKnown" defaultValue="unknown" className="h-10 rounded-md border bg-background px-3 font-normal"><option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not sure</option></select></label>
      <label className="grid gap-2 text-sm font-medium">Timing<select name="urgency" defaultValue="exploring" className="h-10 rounded-md border bg-background px-3 font-normal"><option value="exploring">Exploring</option><option value="quarter">This quarter</option><option value="sixty_days">Within 60 days</option><option value="thirty_days">Within 30 days</option></select></label>
      <fieldset className="grid gap-2 md:col-span-2"><legend className="text-sm font-medium">Capabilities needed</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{capabilityOptions.map((capability) => <label key={capability} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={capabilities.includes(capability)} onChange={() => toggleCapability(capability)} />{capability}</label>)}</div></fieldset>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={writebackRequested} onChange={(event) => setWritebackRequested(event.target.checked)} />I may need approved writeback into the provider</label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">What should the integration support?<textarea required minLength={20} name="context" className="min-h-28 rounded-md border bg-background p-3 font-normal" placeholder="Describe the workflow, data and review you need." /></label>
      <div className="md:col-span-2"><Button type="submit" disabled={submitting || capabilities.length === 0}>{submitting ? 'Sending…' : 'Send integration request'}<Send /></Button></div>
    </form>
  </CardContent></Card>
}
