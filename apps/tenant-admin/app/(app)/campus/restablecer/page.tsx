'use client'

import { Suspense } from 'react'
import { SetPasswordPage } from '../activar/SetPasswordPage'

export default function CampusResetPage() {
  return <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center"><Suspense fallback={<div>Cargando...</div>}><SetPasswordPage mode="reset" /></Suspense></div>
}
