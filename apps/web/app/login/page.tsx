import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Redirección al acceso centralizado.',
}

export default function LoginHubPage() {
  redirect('/accesos')
}
