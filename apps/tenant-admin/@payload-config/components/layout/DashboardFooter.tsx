'use client'

import Link from 'next/link'
import { Shield, Cookie, FileText, Activity } from 'lucide-react'

export function DashboardFooter() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          {/* Legal Links - Left */}
          <div className="flex items-center gap-3">
            <Link
              href="/legal/privacidad"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Privacidad</span>
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/legal/terminos"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Términos</span>
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/legal/cookies"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Cookie className="h-3.5 w-3.5" />
              <span>Cookies</span>
            </Link>
          </div>

          {/* Copyright & System Status - Right */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">© 2025 CEP Comunicación</span>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/estado"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Estado del Sistema</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
