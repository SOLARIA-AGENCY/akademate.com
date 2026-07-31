import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const marks = [
  { href: '/legal/privacidad', src: '/logos/gdpr-logo.png', alt: 'GDPR', label: 'Privacy and GDPR', width: 2000, height: 2000, className: 'h-14 w-14 brightness-0 invert' },
  { href: '/legal/ia', src: '/logos/eu-ai-act.png', alt: 'EU Artificial Intelligence Act', label: 'Responsible AI', width: 846, height: 215, className: 'h-11 w-auto max-w-[12rem] brightness-0 invert' },
] as const

export function ComplianceBadges() {
  return <div className="flex flex-col items-center gap-4 sm:items-end"><p className="text-sm font-semibold text-white">Privacy and responsible AI, built into the conversation.</p><div className="flex flex-nowrap items-center gap-5" aria-label="Privacy and responsible AI information">{marks.map((mark) => <Link key={mark.href} href={mark.href} aria-label={mark.label} className="inline-flex min-h-14 items-center rounded-xl border border-white/10 bg-white/[.06] px-4 opacity-80 transition hover:bg-white/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Image src={mark.src} alt={mark.alt} width={mark.width} height={mark.height} className={`${mark.className} object-contain`} /></Link>)}</div><p className="text-xs text-blue-100/45">Explore how Akademate approaches privacy, transparency and human oversight.</p></div>
}
