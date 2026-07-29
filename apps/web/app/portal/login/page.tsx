import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Acceso al portal', robots: { index: false, follow: false } }

export default function LegacyPortalLoginPage() {
  redirect(process.env.NEXT_PUBLIC_PORTAL_URL?.trim() || '/accesos')
}
