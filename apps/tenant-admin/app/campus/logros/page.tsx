'use client';

/**
 * Campus Achievements (Logros) Page
 *
 * Shows student's badges, points, streaks, and gamification progress.
 */

import { useEffect, useState } from 'react';
import { RequireAuth, useSession } from '../providers/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card';
import { Progress } from '@payload-config/components/ui/progress';
import { Badge } from '@payload-config/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs';
import {
  Trophy,
  Medal,
  Flame,
  Star,
  Zap,
  Target,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  Lock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'achievement' | 'special';
  earnedAt?: string;
  isEarned: boolean;
  progress?: number;
  requirement?: string;
}

interface GamificationData {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  levelProgress: number;
  nextLevelPoints: number;
  badges: BadgeData[];
  recentActivity: {
    id: string;
    type: 'badge' | 'points' | 'milestone';
    title: string;
    description: string;
    points?: number;
    earnedAt: string;
  }[];
  stats: {
    coursesCompleted: number;
    lessonsCompleted: number;
    hoursLearned: number;
    daysActive: number;
  };
}

const BADGE_ICONS: Record<string, any> = {
  trophy: Trophy,
  medal: Medal,
  flame: Flame,
  star: Star,
  zap: Zap,
  target: Target,
  award: Award,
  book: BookOpen,
  clock: Clock,
  trending: TrendingUp,
};

function AchievementsView() {
  const { student } = useSession();
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamification();
  }, [student]);

  const loadGamification = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/campus/gamification', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGamification(data.data);
        }
      }
    } catch (error) {
      console.error('[Campus] Failed to load gamification:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    const IconComponent = BADGE_ICONS[iconName] || Award;
    return IconComponent;
  };

  const getCategoryColor = (category: BadgeData['category']) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-100 text-blue-600';
      case 'streak':
        return 'bg-orange-100 text-orange-600';
      case 'achievement':
        return 'bg-purple-100 text-purple-600';
      case 'special':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Default/mock data if API not available yet
  const data: GamificationData = gamification || {
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    levelProgress: 0,
    nextLevelPoints: 100,
    badges: [],
    recentActivity: [],
    stats: {
      coursesCompleted: 0,
      lessonsCompleted: 0,
      hoursLearned: 0,
      daysActive: 0,
    },
  };

  const earnedBadges = data.badges.filter((b) => b.isEarned);
  const lockedBadges = data.badges.filter((b) => !b.isEarned);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Logros y Recompensas
        </h1>
        <p className="text-muted-foreground mt-1">
          Tus insignias, puntos y racha de aprendizaje
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Level Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-3xl font-bold">Nivel {data.level}</p>
                <div className="mt-2">
                  <Progress value={data.levelProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.totalPoints} / {data.nextLevelPoints} pts
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Puntos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.currentStreak}</p>
                <p className="text-xs text-muted-foreground">
                  Dias Seguidos (Max: {data.longestStreak})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Medal className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {earnedBadges.length}/{data.badges.length}
                </p>
                <p className="text-xs text-muted-foreground">Insignias Ganadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadisticas de Aprendizaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{data.stats.coursesCompleted}</p>
              <p className="text-sm text-muted-foreground">Cursos Completados</p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{data.stats.lessonsCompleted}</p>
              <p className="text-sm text-muted-foreground">Lecciones Completadas</p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{data.stats.hoursLearned}</p>
              <p className="text-sm text-muted-foreground">Horas de Estudio</p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{data.stats.daysActive}</p>
              <p className="text-sm text-muted-foreground">Dias Activo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Tabs */}
      <Tabs defaultValue="earned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earned" className="gap-2">
            <Trophy className="h-4 w-4" />
            Ganadas ({earnedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-2">
            <Lock className="h-4 w-4" />
            Por Desbloquear ({lockedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Actividad Reciente
          </TabsTrigger>
        </TabsList>

        {/* Earned Badges */}
        <TabsContent value="earned">
          {earnedBadges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aun sin insignias</h3>
                <p className="text-muted-foreground">
                  Completa lecciones y cursos para ganar tus primeras insignias!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {earnedBadges.map((badge) => {
                const IconComponent = getBadgeIcon(badge.icon);
                return (
                  <Card key={badge.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6 text-center">
                      <div
                        className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${getCategoryColor(badge.category)}`}
                      >
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <h3 className="font-medium mb-1">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {badge.description}
                      </p>
                      {badge.earnedAt && (
                        <Badge variant="outline" className="text-[10px]">
                          {new Date(badge.earnedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Locked Badges */}
        <TabsContent value="locked">
          {lockedBadges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Todas las insignias desbloqueadas!</h3>
                <p className="text-muted-foreground">
                  Felicidades! Has conseguido todas las insignias disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {lockedBadges.map((badge) => {
                const IconComponent = getBadgeIcon(badge.icon);
                return (
                  <Card key={badge.id} className="opacity-60">
                    <CardContent className="pt-6 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 relative">
                        <IconComponent className="h-8 w-8 text-muted-foreground" />
                        <Lock className="h-4 w-4 absolute -bottom-1 -right-1 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {badge.description}
                      </p>
                      {badge.progress !== undefined && (
                        <div className="mt-2">
                          <Progress value={badge.progress} className="h-1" />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {badge.progress}% completado
                          </p>
                        </div>
                      )}
                      {badge.requirement && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {badge.requirement}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity">
          {data.recentActivity.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin actividad reciente</h3>
                <p className="text-muted-foreground">
                  Completa lecciones para ver tu actividad aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {data.recentActivity.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === 'badge'
                            ? 'bg-yellow-100'
                            : activity.type === 'milestone'
                              ? 'bg-purple-100'
                              : 'bg-blue-100'
                        }`}
                      >
                        {activity.type === 'badge' ? (
                          <Medal className="h-4 w-4 text-yellow-600" />
                        ) : activity.type === 'milestone' ? (
                          <Target className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Zap className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {activity.points && (
                          <p className="text-sm font-medium text-primary">
                            +{activity.points} pts
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.earnedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <RequireAuth>
      <AchievementsView />
    </RequireAuth>
  );
}
