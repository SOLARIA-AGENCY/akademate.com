'use client'

/**
 * Lesson Detail Page
 *
 * Shows lesson content with video player and progress tracking.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import Link from 'next/link'
import { RequireAuth, useSession } from '../../../../providers/SessionProvider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Progress } from '@payload-config/components/ui/progress'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Separator } from '@payload-config/components/ui/separator'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Clock,
  FileText,
  Download,
  BookOpen,
} from 'lucide-react'

interface Material {
  id: string
  title: string
  type: 'pdf' | 'document' | 'link' | 'download'
  url: string
  size?: string
}

interface LessonData {
  lesson: {
    id: string
    title: string
    description?: string
    content?: string
    order: number
    estimatedMinutes: number
    isMandatory: boolean
    videoUrl?: string
    videoDuration?: number
  }
  module: {
    id: string
    title: string
  }
  course: {
    id: string
    title: string
  }
  enrollment: {
    id: string
  }
  progress: {
    status: 'not_started' | 'in_progress' | 'completed'
    progressPercent: number
    videoProgress?: number
    lastPosition?: number
    completedAt?: string
  }
  materials: Material[]
  navigation: {
    previousLesson?: { id: string; title: string }
    nextLesson?: { id: string; title: string }
  }
}

interface LessonApiResponse {
  success: boolean
  data?: LessonData
  error?: string
}

function LessonView() {
  const params = useParams()
  const router = useRouter()
  useSession()
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [_isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const enrollmentId = params.enrollmentId as string
  const lessonId = params.lessonId as string

  const loadLesson = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/lms/lessons/${lessonId}?enrollmentId=${enrollmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load lesson')
      }

      const data = (await response.json()) as LessonApiResponse

      if (data.success && data.data) {
        setLessonData(data.data)
        // Set initial video position if available
        if (data.data.progress?.lastPosition && videoRef.current) {
          videoRef.current.currentTime = data.data.progress.lastPosition
        }
        setVideoProgress(data.data.progress?.videoProgress ?? 0)
      } else {
        throw new Error(data.error ?? 'Unknown error')
      }
    } catch (err) {
      console.error('[Campus] Failed to load lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }, [enrollmentId, lessonId])

  useEffect(() => {
    if (enrollmentId && lessonId) {
      void loadLesson()
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [enrollmentId, lessonId, loadLesson])

  const saveProgress = useCallback(
    async (progress: number, position?: number, completed = false) => {
      try {
        await fetch('/api/lms/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
          },
          body: JSON.stringify({
            enrollmentId,
            lessonId,
            progressPercent: Math.round(progress),
            videoPosition: position,
            completed,
          }),
        })

        if (completed && lessonData) {
          setLessonData({
            ...lessonData,
            progress: {
              ...lessonData.progress,
              status: 'completed',
              progressPercent: 100,
              completedAt: new Date().toISOString(),
            },
          })
        }
      } catch (err) {
        console.error('[Campus] Failed to save progress:', err)
      }
    },
    [enrollmentId, lessonId, lessonData]
  )

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return

    const video = videoRef.current
    const progress = (video.currentTime / video.duration) * 100
    setVideoProgress(progress)
  }, [])

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true)
    // Start progress saving interval
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
        void saveProgress(progress, videoRef.current.currentTime)
      }
    }, 30000) // Save every 30 seconds
  }, [saveProgress])

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    // Save progress immediately on pause
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      void saveProgress(progress, videoRef.current.currentTime)
    }
  }, [saveProgress])

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    // Mark as complete
    void saveProgress(100, undefined, true)
  }, [saveProgress])

  const handleMarkComplete = async () => {
    await saveProgress(100, undefined, true)
  }

  const getMaterialIcon = (type: Material['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" data-oid="27r8jqd" />
      case 'download':
        return <Download className="h-4 w-4" data-oid="-zhiy9d" />
      default:
        return <FileText className="h-4 w-4" data-oid="6r3do:l" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-oid="uskbw2a">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          data-oid="d-z7kd4"
        />
      </div>
    )
  }

  if (error || !lessonData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]" data-oid="4ms0k64">
        <p className="text-destructive mb-4" data-oid="7np_9b_">
          {error ?? 'Lesson not found'}
        </p>
        <Button onClick={() => router.push(`/campus/cursos/${enrollmentId}`)} data-oid="ea85wyj">
          Volver al Curso
        </Button>
      </div>
    )
  }

  const { lesson, module, course, progress, materials, navigation } = lessonData

  return (
    <div className="space-y-6" data-oid="ahh:0wj">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between" data-oid="8x4j8j.">
        <Button
          variant="ghost"
          onClick={() => router.push(`/campus/cursos/${enrollmentId}`)}
          className="gap-2"
          data-oid="ijhf20s"
        >
          <ChevronLeft className="h-4 w-4" data-oid="jb8.8r6" />
          <span className="hidden sm:inline" data-oid="2kp.z3_">
            {course.title}
          </span>
          <span className="sm:hidden" data-oid=".qot2ef">
            Volver
          </span>
        </Button>

        <div className="flex items-center gap-2" data-oid="es93x:m">
          {navigation.previousLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  `/campus/cursos/${enrollmentId}/leccion/${navigation.previousLesson!.id}`
                )
              }
              data-oid="s_flzho"
            >
              <ChevronLeft className="h-4 w-4" data-oid="g5t_hgu" />
              <span className="hidden sm:inline" data-oid="v0wh.2t">
                Anterior
              </span>
            </Button>
          )}
          {navigation.nextLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/campus/cursos/${enrollmentId}/leccion/${navigation.nextLesson!.id}`)
              }
              data-oid="qgcj9bc"
            >
              <span className="hidden sm:inline" data-oid="db_dz9.">
                Siguiente
              </span>
              <ChevronRight className="h-4 w-4" data-oid="f8ijuny" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3" data-oid="5.gppmc">
        {/* Left Column - Video/Content */}
        <div className="lg:col-span-2 space-y-6" data-oid=":.2kxaf">
          {/* Video Player */}
          {lesson.videoUrl && (
            <Card className="overflow-hidden" data-oid="0dg30-:">
              <div className="aspect-video bg-black relative" data-oid="wk91t8i">
                <video
                  ref={videoRef}
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  controls
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                  data-oid="gl077st"
                >
                  <track kind="captions" data-oid="05jqv4g" />
                </video>
                {progress.status === 'completed' && (
                  <div className="absolute top-4 right-4" data-oid="oh:mtno">
                    <Badge className="bg-green-600 gap-1" data-oid="yhw9fud">
                      <CheckCircle2 className="h-3 w-3" data-oid="0fftf16" />
                      Completado
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4" data-oid="zujw1.7">
                <Progress value={videoProgress} className="h-1" data-oid="c-8in_0" />
                <p className="text-xs text-muted-foreground mt-2" data-oid="xw_rpnh">
                  {Math.round(videoProgress)}% completado
                </p>
              </CardContent>
            </Card>
          )}

          {/* Lesson Title & Description */}
          <Card data-oid="poyz:eo">
            <CardHeader data-oid="pg2olxh">
              <div className="flex items-start justify-between" data-oid="jriez0v">
                <div data-oid="njtlxm7">
                  <CardDescription className="text-xs mb-1" data-oid="_65x22p">
                    {module.title}
                  </CardDescription>
                  <CardTitle className="text-xl" data-oid="uc7zapz">
                    {lesson.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2" data-oid="8pugaaw">
                  {lesson.estimatedMinutes > 0 && (
                    <Badge variant="outline" className="gap-1" data-oid="you9_:-">
                      <Clock className="h-3 w-3" data-oid="z7_gv.5" />
                      {lesson.estimatedMinutes} min
                    </Badge>
                  )}
                  {lesson.isMandatory && (
                    <Badge variant="secondary" data-oid="iwgq0_6">
                      Obligatorio
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent data-oid="wu1wli2">
              {lesson.description && (
                <p className="text-muted-foreground mb-4" data-oid="2_8om6p">
                  {lesson.description}
                </p>
              )}
              {lesson.content && (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content || '') }}
                  data-oid=":5rvlmr"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6" data-oid="7lvfv48">
          {/* Progress Card */}
          <Card data-oid="e8mzjw7">
            <CardHeader data-oid="8.a-fhi">
              <CardTitle className="text-lg" data-oid="p:yzr2u">
                Tu Progreso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="aktnewk">
              <div className="flex items-center gap-3" data-oid="yse.:ao">
                {progress.status === 'completed' ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" data-oid="w0yzcmq" />
                ) : progress.status === 'in_progress' ? (
                  <PlayCircle className="h-8 w-8 text-primary" data-oid="i4y3x3h" />
                ) : (
                  <BookOpen className="h-8 w-8 text-muted-foreground" data-oid="rssn8qc" />
                )}
                <div data-oid="bcontlh">
                  <p className="font-medium" data-oid=":fn0e42">
                    {progress.status === 'completed'
                      ? 'Leccion Completada'
                      : progress.status === 'in_progress'
                        ? 'En Progreso'
                        : 'No Iniciada'}
                  </p>
                  <p className="text-sm text-muted-foreground" data-oid="9qde9nh">
                    {progress.progressPercent}% completado
                  </p>
                </div>
              </div>

              {progress.status !== 'completed' && (
                <Button onClick={handleMarkComplete} className="w-full" data-oid="fiek3ef">
                  <CheckCircle2 className="mr-2 h-4 w-4" data-oid="oy_f.bv" />
                  Marcar como Completada
                </Button>
              )}

              {progress.completedAt && (
                <p className="text-xs text-muted-foreground text-center" data-oid="dwzpwa9">
                  Completada el{' '}
                  {new Date(progress.completedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Materials Card */}
          {materials.length > 0 && (
            <Card data-oid="6j9_mvp">
              <CardHeader data-oid="-vtv0mu">
                <CardTitle className="text-lg" data-oid="yv_l_r.">
                  Materiales
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="lxpfdfg">
                <ul className="space-y-3" data-oid="5kpdvn_">
                  {materials.map((material) => (
                    <li key={material.id} data-oid="gl7fjz:">
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                        data-oid="uh7pwxm"
                      >
                        {getMaterialIcon(material.type)}
                        <div className="flex-1 min-w-0" data-oid="ew-tqly">
                          <p className="text-sm font-medium truncate" data-oid="lz1o-er">
                            {material.title}
                          </p>
                          {material.size && (
                            <p className="text-xs text-muted-foreground" data-oid="clekl_:">
                              {material.size}
                            </p>
                          )}
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground" data-oid="r:slxt9" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Navigation Card */}
          <Card data-oid="qidu466">
            <CardHeader data-oid="6y5f8k.">
              <CardTitle className="text-lg" data-oid="fr8ts4.">
                Navegacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="uld7val">
              {navigation.previousLesson && (
                <Link
                  href={`/campus/cursos/${enrollmentId}/leccion/${navigation.previousLesson.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                  data-oid="bpcercc"
                >
                  <ChevronLeft className="h-4 w-4" data-oid="ez8e0su" />
                  <div className="flex-1 min-w-0" data-oid="6uhga37">
                    <p className="text-xs text-muted-foreground" data-oid="__c1c59">
                      Anterior
                    </p>
                    <p className="text-sm font-medium truncate" data-oid="edo_l4f">
                      {navigation.previousLesson.title}
                    </p>
                  </div>
                </Link>
              )}
              {navigation.previousLesson && navigation.nextLesson && (
                <Separator data-oid="y:8dksi" />
              )}
              {navigation.nextLesson && (
                <Link
                  href={`/campus/cursos/${enrollmentId}/leccion/${navigation.nextLesson.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                  data-oid="e5wrtv8"
                >
                  <div className="flex-1 min-w-0" data-oid="8h39x6b">
                    <p className="text-xs text-muted-foreground" data-oid="gugtv6d">
                      Siguiente
                    </p>
                    <p className="text-sm font-medium truncate" data-oid="o8_a_9t">
                      {navigation.nextLesson.title}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4" data-oid="8ex.18b" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LessonPage() {
  return (
    <RequireAuth data-oid="b0lq-tt">
      <LessonView data-oid="wf:f:4q" />
    </RequireAuth>
  )
}
