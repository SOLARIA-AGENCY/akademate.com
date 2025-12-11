'use client'

import { MessageSquareQuote } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function TestimoniosPage() {
  return (
    <ComingSoonPage
      title="Testimonios"
      description="Gestión de testimonios y reseñas de alumnos"
      icon={MessageSquareQuote}
      expectedPhase="Fase F5"
      plannedFeatures={[
        "Recolección de testimonios por email/formulario",
        "Moderación antes de publicar",
        "Asociación con cursos específicos",
        "Rating con estrellas",
        "Foto y datos del alumno",
        "Carrusel automático en web",
      ]}
    />
  )
}
