'use client'

import Link from 'next/link'
import { Shield, Cookie, FileText, Activity } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { useTenantBranding } from '@/app/providers/tenant-branding'

export function DashboardFooter() {
  const { branding } = useTenantBranding()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-card/95 backdrop-blur mt-auto" data-oid="1za0nkc">
      <div className="px-4 md:px-6 py-3" data-oid="52mhq5-">
        <div
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between text-sm"
          data-oid="fa:mmw_"
        >
          <div className="flex flex-wrap items-center gap-3" data-oid="ce-ix3k">
            <Link
              href="/legal/privacidad"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-oid="49zfwop"
            >
              <Shield className="h-3.5 w-3.5" data-oid="-1c3qxz" />
              <span data-oid="bkpj4oo">Privacidad</span>
            </Link>
            <span className="text-muted-foreground/50" data-oid="i1ar4_l">
              •
            </span>
            <Link
              href="/legal/terminos"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-oid="3kgpmpc"
            >
              <FileText className="h-3.5 w-3.5" data-oid="tzl1_o3" />
              <span data-oid="8-r._73">Términos</span>
            </Link>
            <span className="text-muted-foreground/50" data-oid="lngwe_k">
              •
            </span>
            <Link
              href="/legal/cookies"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-oid="r.mdg8j"
            >
              <Cookie className="h-3.5 w-3.5" data-oid="bbqkyy7" />
              <span data-oid="mf6.nwu">Cookies</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3" data-oid="ygn_pzg">
            <Badge variant="outline" className="text-[10px] tracking-wide" data-oid="x1u0p11">
              TENANT DASHBOARD
            </Badge>
            <span className="text-muted-foreground" data-oid="f7goqjy">
              © {year} {branding.academyName}
            </span>
            <span className="text-muted-foreground/50" data-oid="mvf.cz5">
              •
            </span>
            <Link
              href="https://status.cepformacion.akademate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-oid="86j8232"
            >
              <Activity className="h-3.5 w-3.5" data-oid=".t7h2iw" />
              <span data-oid="z.devva">Estado del Sistema</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
