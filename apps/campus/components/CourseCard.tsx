'use client'

import Link from 'next/link'
import { ProgressBar } from './ProgressBar'

/**
 * Course Card Component
 * Displays a student's enrolled course with progress
 */

interface CourseCardProps {
    enrollmentId: string
    courseTitle: string
    courseDescription?: string
    progressPercent: number
    completedLessons: number
    totalLessons: number
    status: 'pending' | 'active' | 'completed' | 'withdrawn' | 'failed'
    thumbnail?: string
}

export function CourseCard({
    enrollmentId,
    courseTitle,
    courseDescription,
    progressPercent,
    completedLessons,
    totalLessons,
    status,
    thumbnail,
}: CourseCardProps) {
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-500/15 text-yellow-500',
        active: 'bg-green-500/15 text-green-500',
        completed: 'bg-blue-500/15 text-blue-500',
        withdrawn: 'bg-gray-500/15 text-gray-500',
        failed: 'bg-red-500/15 text-red-500',
    }

    const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        active: 'En curso',
        completed: 'Completado',
        withdrawn: 'Abandonado',
        failed: 'No superado',
    }

    return (
        <Link href={`/cursos/${enrollmentId}`}>
            <div className="group rounded-xl border border-border bg-card/80 p-4 hover:bg-card hover:border-primary/50 transition-all duration-200 cursor-pointer">
                {thumbnail && (
                    <div className="aspect-video rounded-lg bg-muted mb-4 overflow-hidden">
                        <img
                            src={thumbnail}
                            alt={courseTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{courseTitle}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColors[status]}`}>
                        {statusLabels[status]}
                    </span>
                </div>

                {courseDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {courseDescription}
                    </p>
                )}

                <ProgressBar value={progressPercent} />

                <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                    <span>{completedLessons} de {totalLessons} lecciones</span>
                    {status === 'active' && progressPercent < 100 && (
                        <span className="text-primary font-medium">Continuar →</span>
                    )}
                    {progressPercent === 100 && (
                        <span className="text-green-500 font-medium">✓ Completado</span>
                    )}
                </div>
            </div>
        </Link>
    )
}
