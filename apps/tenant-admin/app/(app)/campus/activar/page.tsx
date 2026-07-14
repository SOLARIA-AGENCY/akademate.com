'use client'

import { Suspense } from 'react'
import { SetPasswordPage } from './SetPasswordPage'

export default function CampusActivatePage() {
  return <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center"><Suspense fallback={<div>Cargando...</div>}><SetPasswordPage mode="activate" /></Suspense></div>
}
