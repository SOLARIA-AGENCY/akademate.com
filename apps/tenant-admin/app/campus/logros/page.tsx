'use client'

/**
 * Campus Achievements (Logros) Page
 *
 * Shows student's badges, points, streaks, and gamification progress.
 */

import { useEffect, useState } from 'react'
import { RequireAuth, useSession } from '../providers/SessionProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Progress } from '@payload-config/components/ui/progress'
import { Badge } from '@payload-config/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
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
} from 'lucide-react'

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  category: 'learning' | 'streak' | 'achievement' | 'special'
  earnedAt?: string
  isEarned: boolean
  progress?: number
  requirement?: string
}

interface GamificationData {
  totalPoints: number
  currentStreak: number
  longestStreak: number
  level: number
  levelProgress: number
  nextLevelPoints: number
  badges: BadgeData[]
  recentActivity: {
    id: string
    type: 'badge' | 'points' | 'milestone'
    title: string
    description: string
    points?: number
    earnedAt: string
  }[]
  stats: {
    coursesCompleted: number
    lessonsCompleted: number
    hoursLearned: number
    daysActive: number
  }
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
}

function AchievementsView() {
  const { student } = useSession()
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamification()
  }, [student])

  const loadGamification = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/campus/gamification', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setGamification(data.data)
        }
      }
    } catch (error) {
      console.error('[Campus] Failed to load gamification:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = (iconName: string) => {
    const IconComponent = BADGE_ICONS[iconName] || Award
    return IconComponent
  }

  const getCategoryColor = (category: BadgeData['category']) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-100 text-blue-600'
      case 'streak':
        return 'bg-orange-100 text-orange-600'
      case 'achievement':
        return 'bg-purple-100 text-purple-600'
      case 'special':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-oid="5dx09vz">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          data-oid="uv56x:."
        />
      </div>
    )
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
  }

  const earnedBadges = data.badges.filter((b) => b.isEarned)
  const lockedBadges = data.badges.filter((b) => !b.isEarned)

  return (
    <div className="space-y-8" data-oid="8.8rggy">
      {/* Header */}
      <div data-oid=".lw2wmy">
        <h1 className="text-3xl font-bold flex items-center gap-3" data-oid="7-tcjiu">
          <Trophy className="h-8 w-8 text-yellow-500" data-oid="o.f8ad_" />
          Logros y Recompensas
        </h1>
        <p className="text-muted-foreground mt-1" data-oid="b4k2alc">
          Tus insignias, puntos y racha de aprendizaje
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4" data-oid="uts43cq">
        {/* Level Card */}
        <Card className="relative overflow-hidden" data-oid="5_q16b0">
          <div
            className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8"
            data-oid="8kmjiwo"
          />
          <CardContent className="pt-6" data-oid="93hbmho">
            <div className="flex items-center gap-4" data-oid="zqx4it6">
              <div className="p-3 bg-primary/10 rounded-full" data-oid="t7kaz1z">
                <Star className="h-6 w-6 text-primary" data-oid="ybcsgtd" />
              </div>
              <div className="flex-1" data-oid="vjl6pel">
                <p className="text-3xl font-bold" data-oid="bw4rr:1">
                  Nivel {data.level}
                </p>
                <div className="mt-2" data-oid="cn0-04y">
                  <Progress value={data.levelProgress} className="h-2" data-oid="a5orfs7" />
                  <p className="text-xs text-muted-foreground mt-1" data-oid="4gbv1xd">
                    {data.totalPoints} / {data.nextLevelPoints} pts
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card data-oid="r_eedyp">
          <CardContent className="pt-6" data-oid="gsivcgb">
            <div className="flex items-center gap-4" data-oid="3rtr7x2">
              <div className="p-3 bg-yellow-100 rounded-full" data-oid="s2opi65">
                <Zap className="h-5 w-5 text-yellow-600" data-oid="45i.o:h" />
              </div>
              <div data-oid="h66prtv">
                <p className="text-2xl font-bold" data-oid="t_3xk6x">
                  {data.totalPoints.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground" data-oid="f1.iamo">
                  Puntos Totales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card data-oid="zzpt0xk">
          <CardContent className="pt-6" data-oid="eebtf6w">
            <div className="flex items-center gap-4" data-oid="a9cmcsm">
              <div className="p-3 bg-orange-100 rounded-full" data-oid="zvaakax">
                <Flame className="h-5 w-5 text-orange-600" data-oid="ukqe_fi" />
              </div>
              <div data-oid="ba7d.t1">
                <p className="text-2xl font-bold" data-oid="ztsiww:">
                  {data.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground" data-oid="_ltaefg">
                  Dias Seguidos (Max: {data.longestStreak})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card data-oid="d0fmbvm">
          <CardContent className="pt-6" data-oid="_ebxn6z">
            <div className="flex items-center gap-4" data-oid="x0ag-0.">
              <div className="p-3 bg-purple-100 rounded-full" data-oid="qckq7h_">
                <Medal className="h-5 w-5 text-purple-600" data-oid="uede:9n" />
              </div>
              <div data-oid="8s:16kt">
                <p className="text-2xl font-bold" data-oid="z-qs8rk">
                  {earnedBadges.length}/{data.badges.length}
                </p>
                <p className="text-xs text-muted-foreground" data-oid="x1p1btx">
                  Insignias Ganadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Stats */}
      <Card data-oid="yxdqirb">
        <CardHeader data-oid="f6d-vq2">
          <CardTitle className="text-lg" data-oid="st3xuel">
            Estadisticas de Aprendizaje
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="tdsflmq">
          <div className="grid gap-6 md:grid-cols-4" data-oid="37:y_qq">
            <div className="text-center" data-oid="8v6dvmt">
              <div
                className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2"
                data-oid="o9p8kpz"
              >
                <CheckCircle2 className="h-6 w-6 text-green-600" data-oid="r2bq-jk" />
              </div>
              <p className="text-2xl font-bold" data-oid="2v-4u0r">
                {data.stats.coursesCompleted}
              </p>
              <p className="text-sm text-muted-foreground" data-oid=":zvopyg">
                Cursos Completados
              </p>
            </div>

            <div className="text-center" data-oid="s7nxw5y">
              <div
                className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2"
                data-oid="2u_6j1l"
              >
                <BookOpen className="h-6 w-6 text-blue-600" data-oid="iy..4xp" />
              </div>
              <p className="text-2xl font-bold" data-oid="p-a-bdx">
                {data.stats.lessonsCompleted}
              </p>
              <p className="text-sm text-muted-foreground" data-oid="bon-pfa">
                Lecciones Completadas
              </p>
            </div>

            <div className="text-center" data-oid="o8497yp">
              <div
                className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2"
                data-oid="54dfg_."
              >
                <Clock className="h-6 w-6 text-purple-600" data-oid="e2aw4fc" />
              </div>
              <p className="text-2xl font-bold" data-oid="u08_w.r">
                {data.stats.hoursLearned}
              </p>
              <p className="text-sm text-muted-foreground" data-oid="yb1urr2">
                Horas de Estudio
              </p>
            </div>

            <div className="text-center" data-oid="odfh-tk">
              <div
                className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2"
                data-oid="t36-v-j"
              >
                <Calendar className="h-6 w-6 text-orange-600" data-oid="a0d8crn" />
              </div>
              <p className="text-2xl font-bold" data-oid="wgfbjb_">
                {data.stats.daysActive}
              </p>
              <p className="text-sm text-muted-foreground" data-oid="e:a.p84">
                Dias Activo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Tabs */}
      <Tabs defaultValue="earned" className="space-y-4" data-oid="1bp0w79">
        <TabsList data-oid="itq8fqs">
          <TabsTrigger value="earned" className="gap-2" data-oid="ack_z._">
            <Trophy className="h-4 w-4" data-oid="iif.:t8" />
            Ganadas ({earnedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-2" data-oid="pol8mzv">
            <Lock className="h-4 w-4" data-oid="3n75g4q" />
            Por Desbloquear ({lockedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2" data-oid="4pmcap3">
            <TrendingUp className="h-4 w-4" data-oid=":xj7:j6" />
            Actividad Reciente
          </TabsTrigger>
        </TabsList>

        {/* Earned Badges */}
        <TabsContent value="earned" data-oid="2dkn1dg">
          {earnedBadges.length === 0 ? (
            <Card data-oid="i8nwhv6">
              <CardContent className="py-12 text-center" data-oid="b763qjj">
                <Trophy
                  className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                  data-oid="m_ua3cj"
                />
                <h3 className="text-lg font-medium mb-2" data-oid="w3v-2_e">
                  Aun sin insignias
                </h3>
                <p className="text-muted-foreground" data-oid="vk739yw">
                  Completa lecciones y cursos para ganar tus primeras insignias!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4" data-oid="u4uo9vl">
              {earnedBadges.map((badge) => {
                const IconComponent = getBadgeIcon(badge.icon)
                return (
                  <Card
                    key={badge.id}
                    className="hover:shadow-lg transition-shadow"
                    data-oid="730yfly"
                  >
                    <CardContent className="pt-6 text-center" data-oid="lei7s5d">
                      <div
                        className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${getCategoryColor(badge.category)}`}
                        data-oid="ohml4zg"
                      >
                        <IconComponent className="h-8 w-8" data-oid="bttp0bf" />
                      </div>
                      <h3 className="font-medium mb-1" data-oid="u435c_:">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2" data-oid="pxsd:2q">
                        {badge.description}
                      </p>
                      {badge.earnedAt && (
                        <Badge variant="outline" className="text-[10px]" data-oid="8.1c811">
                          {new Date(badge.earnedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Locked Badges */}
        <TabsContent value="locked" data-oid="n1176w8">
          {lockedBadges.length === 0 ? (
            <Card data-oid="y66j8nn">
              <CardContent className="py-12 text-center" data-oid="i1kdb:v">
                <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" data-oid="p8requ5" />
                <h3 className="text-lg font-medium mb-2" data-oid="-vk_oi-">
                  Todas las insignias desbloqueadas!
                </h3>
                <p className="text-muted-foreground" data-oid="77eg67k">
                  Felicidades! Has conseguido todas las insignias disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4" data-oid="wg3gb39">
              {lockedBadges.map((badge) => {
                const IconComponent = getBadgeIcon(badge.icon)
                return (
                  <Card key={badge.id} className="opacity-60" data-oid="5fi8jkc">
                    <CardContent className="pt-6 text-center" data-oid="2pao6.2">
                      <div
                        className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 relative"
                        data-oid="o8slii."
                      >
                        <IconComponent
                          className="h-8 w-8 text-muted-foreground"
                          data-oid=".ws6vso"
                        />
                        <Lock
                          className="h-4 w-4 absolute -bottom-1 -right-1 text-muted-foreground"
                          data-oid="zgtj5o9"
                        />
                      </div>
                      <h3 className="font-medium mb-1" data-oid="yfoddpn">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2" data-oid="9ckw9g9">
                        {badge.description}
                      </p>
                      {badge.progress !== undefined && (
                        <div className="mt-2" data-oid="s3f4l:-">
                          <Progress value={badge.progress} className="h-1" data-oid="6ox38xg" />
                          <p className="text-[10px] text-muted-foreground mt-1" data-oid="6yuvd9v">
                            {badge.progress}% completado
                          </p>
                        </div>
                      )}
                      {badge.requirement && (
                        <p className="text-[10px] text-muted-foreground mt-2" data-oid="me824ic">
                          {badge.requirement}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity" data-oid="5jhjpmn">
          {data.recentActivity.length === 0 ? (
            <Card data-oid="c7j9fe.">
              <CardContent className="py-12 text-center" data-oid="3mw0a:_">
                <TrendingUp
                  className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                  data-oid="o4qgia5"
                />
                <h3 className="text-lg font-medium mb-2" data-oid="z--99m1">
                  Sin actividad reciente
                </h3>
                <p className="text-muted-foreground" data-oid="4inek_2">
                  Completa lecciones para ver tu actividad aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card data-oid="7jzhq2x">
              <CardContent className="pt-6" data-oid="eu60t7k">
                <ul className="space-y-4" data-oid="9wdaoe0">
                  {data.recentActivity.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      data-oid="v80tb.b"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === 'badge'
                            ? 'bg-yellow-100'
                            : activity.type === 'milestone'
                              ? 'bg-purple-100'
                              : 'bg-blue-100'
                        }`}
                        data-oid="m7.4t56"
                      >
                        {activity.type === 'badge' ? (
                          <Medal className="h-4 w-4 text-yellow-600" data-oid="u8hvdh1" />
                        ) : activity.type === 'milestone' ? (
                          <Target className="h-4 w-4 text-purple-600" data-oid="2fc5k5o" />
                        ) : (
                          <Zap className="h-4 w-4 text-blue-600" data-oid="bq1bl81" />
                        )}
                      </div>
                      <div className="flex-1" data-oid="7rmpr3d">
                        <p className="font-medium text-sm" data-oid="qna._hy">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground" data-oid="gxkh-no">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-right" data-oid="ru3:8n3">
                        {activity.points && (
                          <p className="text-sm font-medium text-primary" data-oid="fpdhyti">
                            +{activity.points} pts
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground" data-oid="3wcbbcl">
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
  )
}

export default function AchievementsPage() {
  return (
    <RequireAuth data-oid="_9__5in">
      <AchievementsView data-oid="p2js0fd" />
    </RequireAuth>
  )
}
