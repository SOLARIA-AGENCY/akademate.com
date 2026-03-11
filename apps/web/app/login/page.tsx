import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Acceso al Dashboard — Akademate',
  description: 'Accede al panel de gestión de tu academia.',
}

export default function LoginPage() {
  // Server-only env var (no NEXT_PUBLIC_ prefix) — leída en runtime
  const tenantUrl = process.env.TENANT_URL ?? 'https://admin.akademate.com'
  redirect(`${tenantUrl}/auth/login`)
}
