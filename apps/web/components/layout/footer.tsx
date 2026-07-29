import Image from 'next/image'
import Link from 'next/link'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import { legalCompany, legalLinks } from '@/lib/legal-config'
import { publicCompanyLinks } from '@/lib/public-navigation'

const productLinks = [
  { name: 'Features', href: '/features' },
  { name: 'AI-assisted operations', href: '/#ai' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Sign in', href: '/login' },
] as const

export function Footer() {
  return (
    <footer className="bg-[#050f24] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5"><Image src="/logos/akademate-icon-48.png" alt="" width={34} height={34} /><span className="text-sm font-extrabold tracking-[0.12em]">AKADEMATE</span></Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/65">The AI-assisted operating system for modern academies — across classrooms, online learning and every team behind them.</p>
            <p className="mt-5 text-xs text-blue-100/50">A product by {legalCompany.name}</p>
          </div>
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={publicCompanyLinks} />
          <div>
            <FooterColumn title="Legal" links={legalLinks.map(({ title, href }) => ({ name: title, href }))} />
            <a className="mt-5 inline-block text-sm text-blue-200 hover:text-white" href="mailto:hola@akademate.com">hola@akademate.com</a>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-9">
          <ComplianceBadges />
          <div className="mt-8 flex flex-col gap-2 text-center text-xs leading-5 text-blue-100/45 sm:flex-row sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} Akademate. All rights reserved.</p>
            <p>Legal information is a working draft pending professional review.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: readonly { name: string; href: string }[] }) {
  return <div><h2 className="text-sm font-semibold text-white">{title}</h2><ul className="mt-5 space-y-3">{links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-blue-100/60 hover:text-white">{link.name}</Link></li>)}</ul></div>
}
