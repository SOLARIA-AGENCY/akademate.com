import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Información legal', template: '%s | Akademate' },
  robots: { index: true, follow: true },
}
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children
}
