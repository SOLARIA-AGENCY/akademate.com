import Link from 'next/link'

function RegulatoryMark({ kind }: { kind: 'rgpd' | 'ai-act' }) {
  if (kind === 'rgpd') {
    return (
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#003399] text-[11px] font-black tracking-[0.08em] text-white shadow-sm"
      >
        RGPD
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-700 text-center text-[10px] font-black leading-[0.95] tracking-[0.04em] text-white shadow-sm"
    >
      <span>AI</span>
      <span>ACT</span>
    </span>
  )
}

export function ComplianceBadges({
  privacyHref = '/p/legal/privacidad',
  aiHref = '/p/legal/ia',
  className = '',
}: {
  privacyHref?: string
  aiHref?: string
  className?: string
}) {
  const badgeClass =
    'group inline-flex min-h-16 min-w-[13.5rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2'

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 lg:justify-end ${className}`.trim()}
      aria-label="Información regulatoria"
    >
      <Link
        href={privacyHref}
        className={badgeClass}
        aria-label="Privacidad y RGPD"
        title="Información regulatoria; no constituye certificación"
      >
        <RegulatoryMark kind="rgpd" />
        <span>
          <span className="block text-sm font-bold text-slate-950">Privacidad y RGPD</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Aviso, derechos y contacto</span>
        </span>
      </Link>
      <Link
        href={aiHref}
        className={badgeClass}
        aria-label="Transparencia y AI Act"
        title="Información regulatoria; no constituye certificación"
      >
        <RegulatoryMark kind="ai-act" />
        <span>
          <span className="block text-sm font-bold text-slate-950">Transparencia y AI Act</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Usos, límites y supervisión</span>
        </span>
      </Link>
      <span className="basis-full text-center text-[11px] leading-4 text-slate-500 lg:text-right">
        Información regulatoria; no constituye certificación.
      </span>
    </div>
  )
}
