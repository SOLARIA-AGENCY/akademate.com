'use client'

/**
 * Campus Course View
 *
 * Shows course modules and lessons with progress tracking.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { RequireAuth, useSession } from '../../providers/SessionProvider'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Progress } from '@payload-config/components/ui/progress'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@payload-config/components/ui/accordion'
import { BookOpen, Clock, CheckCircle2, PlayCircle, FileText, ChevronLeft } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description?: string
  order: number
  estimatedMinutes: number
  isMandatory: boolean
  progress: {
    status: 'not_started' | 'in_progress' | 'completed'
    progressPercent: number
  }
}

interface Module {
  id: string
  title: string
  description?: string
  order: number
  estimatedMinutes: number
  lessons: Lesson[]
  lessonsCount: number
}

interface CourseData {
  enrollment: {
    id: string
    status: string
    enrolledAt: string
    startedAt?: string
    completedAt?: string
  }
  course: {
    id: string
    title: string
    slug: string
    description: string
    thumbnail?: string
  } | null
  courseRun: {
    id: string
    title: string
    startDate: string
    endDate?: string
    status: string
  } | null
  modules: Module[]
  progress: {
    totalModules: number
    totalLessons: number
    completedLessons: number
    progressPercent: number
    status: string
  }
}

interface CourseApiResponse {
  success: boolean
  data?: CourseData
  error?: string
}

function CourseView() {
  const params = useParams()
  const router = useRouter()
  const { student: _student } = useSession()
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const enrollmentId = params.enrollmentId as string

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/lms/enrollments/${enrollmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load course')
      }

      const data = (await response.json()) as CourseApiResponse

      if (data.success) {
        setCourseData(data.data ?? null)
      } else {
        throw new Error(data.error ?? 'Unknown error')
      }
    } catch (err) {
      console.error('[Campus] Failed to load course:', err)
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    if (enrollmentId) {
      void loadCourse()
    }
  }, [enrollmentId, loadCourse])

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.progress.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" data-oid="_vl.v-_" />
    }
    if (lesson.progress.status === 'in_progress') {
      return <PlayCircle className="h-5 w-5 text-primary" data-oid="v1f45rx" />
    }
    return <FileText className="h-5 w-5 text-muted-foreground" data-oid="reutzhh" />
  }

  const getModuleProgress = (module: Module) => {
    const completed = module.lessons.filter((l) => l.progress.status === 'completed').length
    return Math.round((completed / module.lessons.length) * 100) || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-oid="v5d2op6">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          data-oid="d4c0hd4"
        />
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]" data-oid="394k6du">
        <p className="text-destructive mb-4" data-oid="y0os9i:">
          {error ?? 'Course not found'}
        </p>
        <Button onClick={() => router.push('/campus')} data-oid="l:l59fi">
          Volver al Campus
        </Button>
      </div>
    )
  }

  const { course, courseRun, modules, progress } = courseData

  return (
    <div className="space-y-6" data-oid="1xo-qj7">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/campus')}
        className="mb-4"
        data-oid=".hy:.-b"
      >
        <ChevronLeft className="mr-2 h-4 w-4" data-oid="hd44ywe" />
        Volver a Mis Cursos
      </Button>

      {/* Course Header */}
      <Card data-oid="d5ag2tw">
        <CardContent className="pt-6" data-oid="m15re58">
          <div className="flex flex-col md:flex-row gap-6" data-oid="3uzgu9g">
            {/* Thumbnail */}
            <div
              className="w-full md:w-1/3 aspect-video bg-muted rounded-lg overflow-hidden"
              data-oid="lx:emo_"
            >
              {course?.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  data-oid="8hi2vou"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" data-oid="xevy9g9">
                  <BookOpen className="h-16 w-16 text-muted-foreground" data-oid=":ofcha8" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4" data-oid="ablhfcn">
              <div data-oid="sg.zg7f">
                <h1 className="text-2xl font-bold" data-oid="8_4.93z">
                  {course?.title}
                </h1>
                {courseRun && (
                  <p className="text-muted-foreground" data-oid="af2m9vv">
                    {courseRun.title}
                  </p>
                )}
              </div>

              {course?.description && (
                <p className="text-sm text-muted-foreground line-clamp-3" data-oid="uu5r79e">
                  {course.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="space-y-2" data-oid="s9bemed">
                <div className="flex justify-between text-sm" data-oid="-z--ea0">
                  <span className="text-muted-foreground" data-oid="tfht_pn">
                    Tu Progreso
                  </span>
                  <span className="font-medium" data-oid="wf0su6q">
                    {progress.progressPercent}%
                  </span>
                </div>
                <Progress value={progress.progressPercent} className="h-3" data-oid="z6ykz3u" />
                <p className="text-xs text-muted-foreground" data-oid="6aqjo1u">
                  {progress.completedLessons} de {progress.totalLessons} lecciones completadas
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm" data-oid="o9rshs3">
                <div className="flex items-center gap-1 text-muted-foreground" data-oid="cmmmavc">
                  <BookOpen className="h-4 w-4" data-oid="oagqdzg" />
                  <span data-oid="o4tj-qb">{progress.totalModules} modulos</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground" data-oid="32drlhr">
                  <FileText className="h-4 w-4" data-oid="1k_81dh" />
                  <span data-oid="gapl1x2">{progress.totalLessons} lecciones</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Accordion */}
      <div className="space-y-4" data-oid="wxzqjmj">
        <h2 className="text-xl font-semibold" data-oid="m2qjsvi">
          Contenido del Curso
        </h2>

        <Accordion type="multiple" className="space-y-4" data-oid="s4e6-wt">
          {modules.map((module, moduleIndex) => (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg bg-card"
              data-oid=":v75:bs"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline" data-oid="75vqcn7">
                <div className="flex items-center gap-4 w-full" data-oid="vwraolc">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium"
                    data-oid=":e3qv:5"
                  >
                    {moduleIndex + 1}
                  </div>
                  <div className="flex-1 text-left" data-oid="vi:sb3j">
                    <h3 className="font-medium" data-oid="4rz5595">
                      {module.title}
                    </h3>
                    <p className="text-xs text-muted-foreground" data-oid="gwa2wp1">
                      {module.lessonsCount} lecciones
                      {module.estimatedMinutes > 0 && ` • ${module.estimatedMinutes} min`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mr-4" data-oid="j64gem8">
                    <Progress
                      value={getModuleProgress(module)}
                      className="w-20 h-2"
                      data-oid="q_q_5is"
                    />
                    <span className="text-xs text-muted-foreground w-10" data-oid="ld3-c:9">
                      {getModuleProgress(module)}%
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4" data-oid="08f.32y">
                <div className="space-y-2 pt-2" data-oid="dblu1-k">
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/campus/cursos/${enrollmentId}/leccion/${lesson.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      data-oid="nqja5:x"
                    >
                      {getLessonIcon(lesson)}
                      <div className="flex-1 min-w-0" data-oid="kl3g350">
                        <p className="font-medium text-sm truncate" data-oid="jr0pks0">
                          {lesson.title}
                        </p>
                        <div
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                          data-oid="31t5ed3"
                        >
                          {lesson.estimatedMinutes > 0 && (
                            <span className="flex items-center gap-1" data-oid="zyqlrl8">
                              <Clock className="h-3 w-3" data-oid="uj9k1:_" />
                              {lesson.estimatedMinutes} min
                            </span>
                          )}
                          {lesson.isMandatory && (
                            <Badge variant="outline" className="text-[10px]" data-oid="z8jl07d">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                      </div>
                      {lesson.progress.status === 'in_progress' && (
                        <div className="text-xs text-primary" data-oid="oi0h.7t">
                          {lesson.progress.progressPercent}%
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

export default function CoursePage() {
  return (
    <RequireAuth data-oid="1b_2f6r">
      <CourseView data-oid="3_3c9s2" />
    </RequireAuth>
  )
}
