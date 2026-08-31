'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@payload-config/components/ui/sidebar'
import { useSession } from '../providers/SessionProvider'
import { CampusSidebar } from './CampusSidebar'
import { CampusTopbar } from './CampusTopbar'
import { CampusCommand } from './CampusCommand'
import type { EnrollmentCard } from '../lib/dashboard'

export function CampusShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isLogin = pathname === '/campus/login' || pathname.startsWith('/campus/login/')
  const { enrollments } = useSession()
  const [commandOpen, setCommandOpen] = useState(false)
  const [roleLabel, setRoleLabel] = useState<string | null>(null)

  useEffect(() => {
    const first = enrollments[0] as { courseTitle?: string } | undefined
    if (first?.courseTitle) {
      setRoleLabel(`Alumno · ${first.courseTitle}`)
    }
  }, [enrollments])

  if (isLogin) {
    return <>{children}</>
  }

  const commandEnrollments: EnrollmentCard[] = enrollments.map((item) => ({
    id: item.id,
    courseTitle: item.courseTitle,
    courseRunTitle: '',
    status: item.status,
    progressPercent: item.progressPercent,
    estimatedMinutesRemaining: 0,
  }))

  return (
    <SidebarProvider className="min-h-svh bg-[hsl(var(--dashboard-canvas))]">
      <CampusSidebar />
      <SidebarInset className="bg-[hsl(var(--dashboard-canvas))]">
        <CampusTopbar roleLabel={roleLabel} onSearchFocus={() => setCommandOpen(true)} />
        <div className="flex-1 px-4 py-6 md:px-6">{children}</div>
      </SidebarInset>
      <CampusCommand open={commandOpen} onOpenChange={setCommandOpen} enrollments={commandEnrollments} />
    </SidebarProvider>
  )
}
