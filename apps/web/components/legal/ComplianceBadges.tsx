import Link from 'next/link'
import { ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'

const regulatoryNotice = 'Información regulatoria; no constituye certificación'

export function ComplianceBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-label={regulatoryNotice}>
      <Link
        href="/legal/privacidad"
        title={regulatoryNotice}
        aria-label={`Privacidad y RGPD. ${regulatoryNotice}`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Privacidad y RGPD
      </Link>
      <Link
        href="/legal/ia"
        title={regulatoryNotice}
        aria-label={`Transparencia de IA. ${regulatoryNotice}`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Transparencia de IA
      </Link>
    </div>
  )
}
