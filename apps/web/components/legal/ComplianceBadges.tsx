import Link from 'next/link'
import { ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'

const regulatoryNotice = 'Información regulatoria; no constituye certificación ni sello oficial'

export function ComplianceBadges() {
  return (
    <div className="flex flex-col items-center gap-2" aria-label={regulatoryNotice}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/legal/privacidad"
          aria-label={`Privacidad y RGPD. ${regulatoryNotice}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Privacidad y RGPD
        </Link>
        <Link
          href="/legal/ia"
          aria-label={`Transparencia de IA. ${regulatoryNotice}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Transparencia de IA
        </Link>
      </div>
      <p className="text-center text-[11px] leading-4 text-muted-foreground">{regulatoryNotice}</p>
    </div>
  )
}
