'use client';

/**
 * Campus Virtual Dashboard
 *
 * Shows student's active enrollments and course progress.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, RequireAuth } from './providers/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card';
import { Progress } from '@payload-config/components/ui/progress';
import { Badge } from '@payload-config/components/ui/badge';
import { Button } from '@payload-config/components/ui/button';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Award,
  Flame,
  TrendingUp,
} from 'lucide-react';

interface EnrollmentCard {
  id: string;
  courseTitle: string;
  courseThumbnail?: string;
  courseRunTitle: string;
  status: string;
  progressPercent: number;
  totalModules: number;
  completedModules: number;
  lastAccessedAt?: string;
  estimatedMinutesRemaining: number;
}

interface StudentStats {
  totalCourses: number;
  completedCourses: number;
  currentStreak: number;
  totalBadges: number;
  totalPoints: number;
}

function CampusDashboard() {
  const { student } = useSession();
  const [enrollments, setEnrollments] = useState<EnrollmentCard[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        // Fetch student's enrollments
        const response = await fetch('/api/campus/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json() as { enrollments?: EnrollmentCard[]; stats?: StudentStats | null };
          setEnrollments(data.enrollments ?? []);
          setStats(data.stats ?? null);
        }
      } catch (error) {
        console.error('[Campus] Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [student]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="default">En Progreso</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-600">Completado</Badge>;
      case 'not_started':
        return <Badge variant="secondary">No Iniciado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Hola, {student?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Continua tu aprendizaje donde lo dejaste.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Cursos Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedCourses}</p>
                  <p className="text-xs text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Dias Seguidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalBadges}</p>
                  <p className="text-xs text-muted-foreground">Insignias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enrollments Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mis Cursos</h2>

        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin Cursos Activos</h3>
              <p className="text-muted-foreground mb-4">
                Aun no estas matriculado en ningun curso.
              </p>
              <Button asChild>
                <Link href="/campus/catalogo">Explorar Cursos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative">
                  {enrollment.courseThumbnail ? (
                    <img
                      src={enrollment.courseThumbnail}
                      alt={enrollment.courseTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(enrollment.status)}
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {enrollment.courseTitle}
                  </CardTitle>
                  <CardDescription>{enrollment.courseRunTitle}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{enrollment.progressPercent}%</span>
                    </div>
                    <Progress value={enrollment.progressPercent} className="h-2" />
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {enrollment.completedModules}/{enrollment.totalModules} modulos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.round(enrollment.estimatedMinutesRemaining / 60)}h restantes
                    </span>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full">
                    <Link href={`/campus/cursos/${enrollment.id}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {enrollment.status === 'not_started' ? 'Comenzar' : 'Continuar'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampusPage() {
  return (
    <RequireAuth>
      <CampusDashboard />
    </RequireAuth>
  );
}
