'use client';

/**
 * Lesson Detail Page
 *
 * Shows lesson content with video player and progress tracking.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RequireAuth, useSession } from '../../../../providers/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card';
import { Progress } from '@payload-config/components/ui/progress';
import { Badge } from '@payload-config/components/ui/badge';
import { Button } from '@payload-config/components/ui/button';
import { Separator } from '@payload-config/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Clock,
  FileText,
  Download,
  BookOpen,
  Video,
  Maximize2,
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'document' | 'link' | 'download';
  url: string;
  size?: string;
}

interface LessonData {
  lesson: {
    id: string;
    title: string;
    description?: string;
    content?: string;
    order: number;
    estimatedMinutes: number;
    isMandatory: boolean;
    videoUrl?: string;
    videoDuration?: number;
  };
  module: {
    id: string;
    title: string;
  };
  course: {
    id: string;
    title: string;
  };
  enrollment: {
    id: string;
  };
  progress: {
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercent: number;
    videoProgress?: number;
    lastPosition?: number;
    completedAt?: string;
  };
  materials: Material[];
  navigation: {
    previousLesson?: { id: string; title: string };
    nextLesson?: { id: string; title: string };
  };
}

function LessonView() {
  const params = useParams();
  const router = useRouter();
  const { student } = useSession();
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const enrollmentId = params.enrollmentId as string;
  const lessonId = params.lessonId as string;

  useEffect(() => {
    if (enrollmentId && lessonId) {
      loadLesson();
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [enrollmentId, lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lms/lessons/${lessonId}?enrollmentId=${enrollmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load lesson');
      }

      const data = await response.json();

      if (data.success) {
        setLessonData(data.data);
        // Set initial video position if available
        if (data.data.progress?.lastPosition && videoRef.current) {
          videoRef.current.currentTime = data.data.progress.lastPosition;
        }
        setVideoProgress(data.data.progress?.videoProgress || 0);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[Campus] Failed to load lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = useCallback(async (progress: number, position?: number, completed = false) => {
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
      });

      if (completed && lessonData) {
        setLessonData({
          ...lessonData,
          progress: {
            ...lessonData.progress,
            status: 'completed',
            progressPercent: 100,
            completedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err) {
      console.error('[Campus] Failed to save progress:', err);
    }
  }, [enrollmentId, lessonId, lessonData]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(progress);
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
    // Start progress saving interval
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        saveProgress(progress, videoRef.current.currentTime);
      }
    }, 30000); // Save every 30 seconds
  }, [saveProgress]);

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    // Save progress immediately on pause
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      saveProgress(progress, videoRef.current.currentTime);
    }
  }, [saveProgress]);

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    // Mark as complete
    saveProgress(100, undefined, true);
  }, [saveProgress]);

  const handleMarkComplete = async () => {
    await saveProgress(100, undefined, true);
  };

  const getMaterialIcon = (type: Material['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive mb-4">{error || 'Lesson not found'}</p>
        <Button onClick={() => router.push(`/campus/cursos/${enrollmentId}`)}>
          Volver al Curso
        </Button>
      </div>
    );
  }

  const { lesson, module, course, progress, materials, navigation } = lessonData;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/campus/cursos/${enrollmentId}`)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{course.title}</span>
          <span className="sm:hidden">Volver</span>
        </Button>

        <div className="flex items-center gap-2">
          {navigation.previousLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/campus/cursos/${enrollmentId}/leccion/${navigation.previousLesson!.id}`)
              }
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
          )}
          {navigation.nextLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/campus/cursos/${enrollmentId}/leccion/${navigation.nextLesson!.id}`)
              }
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Video/Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          {lesson.videoUrl && (
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black relative">
                <video
                  ref={videoRef}
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  controls
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                />
                {progress.status === 'completed' && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-600 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completado
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <Progress value={videoProgress} className="h-1" />
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(videoProgress)}% completado
                </p>
              </CardContent>
            </Card>
          )}

          {/* Lesson Title & Description */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardDescription className="text-xs mb-1">
                    {module.title}
                  </CardDescription>
                  <CardTitle className="text-xl">{lesson.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.estimatedMinutes > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.estimatedMinutes} min
                    </Badge>
                  )}
                  {lesson.isMandatory && (
                    <Badge variant="secondary">Obligatorio</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lesson.description && (
                <p className="text-muted-foreground mb-4">{lesson.description}</p>
              )}
              {lesson.content && (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tu Progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {progress.status === 'completed' ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : progress.status === 'in_progress' ? (
                  <PlayCircle className="h-8 w-8 text-primary" />
                ) : (
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {progress.status === 'completed'
                      ? 'Leccion Completada'
                      : progress.status === 'in_progress'
                        ? 'En Progreso'
                        : 'No Iniciada'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {progress.progressPercent}% completado
                  </p>
                </div>
              </div>

              {progress.status !== 'completed' && (
                <Button onClick={handleMarkComplete} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marcar como Completada
                </Button>
              )}

              {progress.completedAt && (
                <p className="text-xs text-muted-foreground text-center">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Materiales</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {materials.map((material) => (
                    <li key={material.id}>
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        {getMaterialIcon(material.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{material.title}</p>
                          {material.size && (
                            <p className="text-xs text-muted-foreground">{material.size}</p>
                          )}
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Navigation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navegacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {navigation.previousLesson && (
                <Link
                  href={`/campus/cursos/${enrollmentId}/leccion/${navigation.previousLesson.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Anterior</p>
                    <p className="text-sm font-medium truncate">
                      {navigation.previousLesson.title}
                    </p>
                  </div>
                </Link>
              )}
              {navigation.previousLesson && navigation.nextLesson && <Separator />}
              {navigation.nextLesson && (
                <Link
                  href={`/campus/cursos/${enrollmentId}/leccion/${navigation.nextLesson.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Siguiente</p>
                    <p className="text-sm font-medium truncate">{navigation.nextLesson.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <RequireAuth>
      <LessonView />
    </RequireAuth>
  );
}
