'use client';

/**
 * Campus Course View
 *
 * Shows course modules and lessons with progress tracking.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RequireAuth, useSession } from '../../providers/SessionProvider';
import { Card, CardContent } from '@payload-config/components/ui/card';
import { Progress } from '@payload-config/components/ui/progress';
import { Badge } from '@payload-config/components/ui/badge';
import { Button } from '@payload-config/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@payload-config/components/ui/accordion';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileText,
  ChevronLeft,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes: number;
  isMandatory: boolean;
  progress: {
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercent: number;
  };
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes: number;
  lessons: Lesson[];
  lessonsCount: number;
}

interface CourseData {
  enrollment: {
    id: string;
    status: string;
    enrolledAt: string;
    startedAt?: string;
    completedAt?: string;
  };
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
  } | null;
  courseRun: {
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    status: string;
  } | null;
  modules: Module[];
  progress: {
    totalModules: number;
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    status: string;
  };
}

interface CourseApiResponse {
  success: boolean;
  data?: CourseData;
  error?: string;
}

function CourseView() {
  const params = useParams();
  const router = useRouter();
  const { student: _student } = useSession();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enrollmentId = params.enrollmentId as string;

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lms/enrollments/${enrollmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load course');
      }

      const data = (await response.json()) as CourseApiResponse;

      if (data.success) {
        setCourseData(data.data ?? null);
      } else {
        throw new Error(data.error ?? 'Unknown error');
      }
    } catch (err) {
      console.error('[Campus] Failed to load course:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    if (enrollmentId) {
      void loadCourse();
    }
  }, [enrollmentId, loadCourse]);

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.progress.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (lesson.progress.status === 'in_progress') {
      return <PlayCircle className="h-5 w-5 text-primary" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getModuleProgress = (module: Module) => {
    const completed = module.lessons.filter((l) => l.progress.status === 'completed').length;
    return Math.round((completed / module.lessons.length) * 100) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive mb-4">{error ?? 'Course not found'}</p>
        <Button onClick={() => router.push('/campus')}>Volver al Campus</Button>
      </div>
    );
  }

  const { course, courseRun, modules, progress } = courseData;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/campus')} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver a Mis Cursos
      </Button>

      {/* Course Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-1/3 aspect-video bg-muted rounded-lg overflow-hidden">
              {course?.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{course?.title}</h1>
                {courseRun && (
                  <p className="text-muted-foreground">{courseRun.title}</p>
                )}
              </div>

              {course?.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {course.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tu Progreso</span>
                  <span className="font-medium">{progress.progressPercent}%</span>
                </div>
                <Progress value={progress.progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {progress.completedLessons} de {progress.totalLessons} lecciones completadas
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{progress.totalModules} modulos</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{progress.totalLessons} lecciones</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Accordion */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contenido del Curso</h2>

        <Accordion type="multiple" className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {moduleIndex + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">{module.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {module.lessonsCount} lecciones
                      {module.estimatedMinutes > 0 && ` • ${module.estimatedMinutes} min`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                    <Progress value={getModuleProgress(module)} className="w-20 h-2" />
                    <span className="text-xs text-muted-foreground w-10">
                      {getModuleProgress(module)}%
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/campus/cursos/${enrollmentId}/leccion/${lesson.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      {getLessonIcon(lesson)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {lesson.estimatedMinutes > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.estimatedMinutes} min
                            </span>
                          )}
                          {lesson.isMandatory && (
                            <Badge variant="outline" className="text-[10px]">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                      </div>
                      {lesson.progress.status === 'in_progress' && (
                        <div className="text-xs text-primary">
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
  );
}

export default function CoursePage() {
  return (
    <RequireAuth>
      <CourseView />
    </RequireAuth>
  );
}
