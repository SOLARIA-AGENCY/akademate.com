'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth, useSession } from '../providers/SessionProvider'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Progress } from '@payload-config/components/ui/progress'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import { continueEnrollments, type EnrollmentCard } from '../lib/dashboard'
import { CampusEmptyState } from '../components/CampusEmptyState'

export default function MisCursosPage() {
  return (
    <RequireAuth>
      <CursosList />
    </RequireAuth>
  )
}

function CursosList() {
  const { student } = useSession()
  const [enrollments, setEnrollments] = useState<EnrollmentCard[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!student) return
    const load = async () => {
      try {
        const response = await fetch('/api/campus/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('campus_token')}` },
        })
        if (!response.ok) return
        const data = (await response.json()) as { enrollments?: EnrollmentCard[] }
        setEnrollments(data.enrollments ?? [])
      } finally {
        setLoaded(true)
      }
    }
    void load()
  }, [student])

  const items = continueEnrollments(enrollments, 20)

  if (!loaded) return null

  if (items.length === 0) {
    return (
      <CampusEmptyState
        title="Mis cursos"
        description="Aún no estás matriculado en ningún curso."
      />
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Mis cursos</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((enrollment) => (
          <Card key={enrollment.id}>
            <CardContent className="flex items-start gap-4 p-5">
              <EntityThumb src={enrollment.courseThumbnail} alt={enrollment.courseTitle} />
              <div className="min-w-0 flex-1 space-y-2">
                <Link href={`/campus/cursos/${enrollment.id}`} className="font-medium text-slate-900">
                  {enrollment.courseTitle}
                </Link>
                <Progress value={enrollment.progressPercent} className="h-2" />
                <p className="text-xs text-slate-500">{enrollment.progressPercent}% completado</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
