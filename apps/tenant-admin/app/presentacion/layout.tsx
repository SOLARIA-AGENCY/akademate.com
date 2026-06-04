import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Presentacion operativa | CEP Formacion',
  description:
    'Recorrido interactivo de Akademate para CEP Formacion: cursos, convocatorias, sedes, aulas, leads, matriculas, KPIs y roadmap.',
}

export default function PresentationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
