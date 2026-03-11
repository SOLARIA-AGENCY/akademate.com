import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Acceso al Dashboard — Akademate',
  description: 'Accede al panel de gestión de tu academia.',
}

export default function LoginPage() {
  const tenantUrl = process.env.NEXT_PUBLIC_TENANT_URL ?? 'https://admin.akademate.com'
  redirect(`${tenantUrl}/auth/login`)
}
