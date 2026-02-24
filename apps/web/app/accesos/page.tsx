import type { Metadata } from 'next'
import { LoginGateway } from '@/app/login/LoginGateway'

export const metadata: Metadata = {
  title: 'AKADEMATE SAAS PLATFORM',
  description: 'Acceso principal a todas las superficies de AKADEMATE.',
}

export default function AccessPage() {
  return <LoginGateway />
}
