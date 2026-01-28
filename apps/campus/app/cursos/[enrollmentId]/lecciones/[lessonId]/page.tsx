'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Wifi, WifiOff } from 'lucide-react'
import { updateLessonProgress, fetchModuleDetail } from '@/lib/api'
import { useCourseProgress, useGamification } from '@/hooks'
import { PointsAnimation, ProgressRing } from '@/components/gamification'

// ============================================================================
// LOCAL TYPE DEFINITIONS (for ESLint type resolution)
// ============================================================================

interface PageProps {
    params: Promise<{ enrollmentId: string; lessonId: string }>
}

interface ModuleLessonData {
    id: string
    title: string
    type?: 'text' | 'video' | 'quiz' | 'assignment' | 'live_session'
    content?: string
    videoUrl?: string
    estimatedMinutes?: number
    resources?: { title: string; url: string; type: string }[]
    progress?: {
        status: string
        progressPercent: number
        timeSpentMinutes: number
    }
}

interface LessonContent {
    id: string
    title: string
    type: 'text' | 'video' | 'quiz' | 'assignment' | 'live_session'
    content?: string
    videoUrl?: string
    duration?: number
    isCompleted: boolean
    resources?: { title: string; url: string; type: string }[]
}

/** Local CourseProgress type for proper ESLint resolution */
interface CourseProgressData {
    enrollmentId: string
    courseId: string
    overallProgress: number
    modulesCompleted: number
    modulesTotal: number
    lessonsCompleted: number
    lessonsTotal: number
    timeSpent: number
    lastActivity: string
}

/** Local GamificationData type for proper ESLint resolution */
interface GamificationDataLocal {
    userId: string
    points: number
    level: number
    levelProgress: number
    pointsToNextLevel: number
    currentStreak: number
    longestStreak: number
}

/** Local PointsAnimation type for proper ESLint resolution */
interface PointsAnimationData {
    id: string
    points: number
    reason: string
    timestamp: Date
}

/** Local ModuleDetailData type for proper ESLint resolution */
interface ModuleDetailDataLocal {
    id: string
    title: string
    slug: string
    description?: string
    order: number
    estimatedMinutes?: number
    lessons: ModuleLessonData[]
    lessonsCount: number
    materialsCount: number
}

// Type aliases for API functions to satisfy ESLint
type FetchModuleDetailFn = (moduleId: string, enrollmentId: string | null) => Promise<ModuleDetailDataLocal>
type UpdateLessonProgressFn = (data: { enrollmentId: string; lessonId: string; isCompleted?: boolean; timeSpent?: number; lastPosition?: number }) => Promise<unknown>

export default function LessonPage({ params }: PageProps) {
    const searchParams = useSearchParams()
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
    const [lessonId, setLessonId] = useState<string | null>(null)
    const [moduleId, setModuleId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [marking, setMarking] = useState(false)
    const [lesson, setLesson] = useState<LessonContent | null>(null)
    const [isCompleted, setIsCompleted] = useState(false)

    // Real-time hooks with explicit type assertions for ESLint
    interface CourseProgressHookReturn {
        progress: CourseProgressData | null
        markLessonComplete: (lessonId: string) => void
        isConnected: boolean
    }
    const courseProgressHook = (useCourseProgress as (opts: { enrollmentId: string; enableRealtime: boolean }) => CourseProgressHookReturn)({
        enrollmentId: enrollmentId ?? '',
        enableRealtime: !!enrollmentId,
    })
    const courseProgress = courseProgressHook.progress
    const markLessonCompleteRealtime = courseProgressHook.markLessonComplete
    const progressConnected = courseProgressHook.isConnected

    interface GamificationHookReturn {
        data: GamificationDataLocal | null
        pendingAnimations: PointsAnimationData[]
        isConnected: boolean
        dismissAnimation: (id: string) => void
    }
    const gamificationHook = (useGamification as (opts: { enableRealtime: boolean }) => GamificationHookReturn)({
        enableRealtime: !!enrollmentId,
    })
    const gamification = gamificationHook.data
    const pendingAnimations = gamificationHook.pendingAnimations
    const gamificationConnected = gamificationHook.isConnected
    const dismissAnimation = gamificationHook.dismissAnimation

    const isConnected = progressConnected ?? gamificationConnected

    useEffect(() => {
        void params.then(p => {
            setEnrollmentId(p.enrollmentId)
            setLessonId(p.lessonId)
        })
        setModuleId(searchParams.get('moduleId'))
    }, [params, searchParams])

    useEffect(() => {
        if (!enrollmentId || !lessonId) return

        async function loadLesson(): Promise<void> {
            try {
                setLoading(true)

                // Fetch module details with lessons
                if (moduleId) {
                    const moduleData = await (fetchModuleDetail as FetchModuleDetailFn)(moduleId, enrollmentId)

                    // Find the specific lesson
                    const lessonData: ModuleLessonData | undefined = moduleData.lessons.find(
                        (l) => l.id === lessonId
                    )

                    if (lessonData) {
                        setLesson({
                            id: lessonData.id,
                            title: lessonData.title,
                            type: lessonData.type ?? 'text',
                            content: lessonData.content,
                            videoUrl: lessonData.videoUrl,
                            duration: lessonData.estimatedMinutes,
                            isCompleted: lessonData.progress?.status === 'completed',
                            resources: lessonData.resources,
                        })
                        setIsCompleted(lessonData.progress?.status === 'completed')
                    }
                }
            } catch (err: unknown) {
                console.error('Error loading lesson:', err)
                // Fallback to basic lesson info if module fetch fails
                // lessonId is guaranteed non-null here due to early return check
                setLesson({
                    id: lessonId!,
                    title: 'Lección',
                    type: 'text',
                    content: '<p>No se pudo cargar el contenido.</p>',
                    isCompleted: false,
                })
            } finally {
                setLoading(false)
            }
        }

        void loadLesson()
    }, [enrollmentId, lessonId, moduleId])

    async function handleMarkComplete(): Promise<void> {
        if (!enrollmentId || !lessonId) return

        try {
            setMarking(true)

            // Call API to persist
            await (updateLessonProgress as UpdateLessonProgressFn)({
                enrollmentId,
                lessonId,
                isCompleted: true,
            })

            // Emit real-time event for gamification
            if (isConnected) {
                markLessonCompleteRealtime(lessonId)
            }

            setIsCompleted(true)
        } catch (err: unknown) {
            console.error('Error marking lesson complete:', err)
        } finally {
            setMarking(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-muted-foreground">Cargando lección...</div>
            </div>
        )
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive">Lección no encontrada</p>
                <Link href={`/cursos/${enrollmentId}`} className="text-primary hover:underline">
                    ← Volver al curso
                </Link>
            </div>
        )
    }

    return (
        <>
            {/* Points Animation Overlay */}
            <PointsAnimation
                animations={pendingAnimations}
                onDismiss={dismissAnimation}
            />

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <Link href={`/cursos/${enrollmentId}`} className="text-muted-foreground hover:text-foreground">
                        ← Volver al curso
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Course Progress */}
                        {courseProgress && (
                            <div className="flex items-center gap-2">
                                <ProgressRing
                                    progress={courseProgress.overallProgress}
                                    size={32}
                                    strokeWidth={3}
                                    showLabel={false}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {courseProgress.overallProgress}% curso
                                </span>
                            </div>
                        )}

                        {/* Gamification points */}
                        {gamification && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
                                <span>⭐</span>
                                <span>{gamification.points}</span>
                            </div>
                        )}

                        {/* Connection status */}
                        <div className="flex items-center gap-1 text-xs">
                            {isConnected ? (
                                <>
                                    <Wifi className="h-3 w-3 text-green-500" />
                                    <span className="text-green-600">En vivo</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lesson Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            lesson.type === 'video' ? 'bg-blue-500/15 text-blue-500' :
                            lesson.type === 'quiz' ? 'bg-purple-500/15 text-purple-500' :
                            lesson.type === 'assignment' ? 'bg-orange-500/15 text-orange-500' :
                            'bg-gray-500/15 text-gray-500'
                        }`}>
                            {lesson.type === 'video' ? '📹 Vídeo' :
                             lesson.type === 'quiz' ? '❓ Quiz' :
                             lesson.type === 'assignment' ? '📝 Tarea' :
                             lesson.type === 'live_session' ? '🎥 En vivo' :
                             '📖 Texto'}
                        </span>
                        {lesson.duration && (
                            <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>
                </div>

                {/* Video Player */}
                {lesson.type === 'video' && lesson.videoUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe
                            src={lesson.videoUrl}
                            title={`Vídeo: ${lesson.title}`}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    </div>
                )}

                {/* Content */}
                {lesson.content && (
                    <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                )}

                {/* Mark Complete Button */}
                <div className="flex justify-end">
                    {isCompleted || lesson.isCompleted ? (
                        <div className="flex items-center gap-2 text-green-500">
                            <span>✓</span>
                            <span>Lección completada</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleMarkComplete}
                            disabled={marking}
                            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {marking ? 'Guardando...' : 'Marcar como completada'}
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
