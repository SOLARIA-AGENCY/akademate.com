'use client'

/**
 * Campus Virtual Dashboard
 *
 * Shows student's active enrollments and course progress.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, RequireAuth } from './providers/SessionProvider'
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
import { BookOpen, Clock, CheckCircle2, PlayCircle, Award, Flame, TrendingUp } from 'lucide-react'

interface EnrollmentCard {
  id: string
  courseTitle: string
  courseThumbnail?: string
  courseRunTitle: string
  status: string
  progressPercent: number
  totalModules: number
  completedModules: number
  lastAccessedAt?: string
  estimatedMinutesRemaining: number
}

interface StudentStats {
  totalCourses: number
  completedCourses: number
  currentStreak: number
  totalBadges: number
  totalPoints: number
}

function CampusDashboard() {
  const { student } = useSession()
  const [enrollments, setEnrollments] = useState<EnrollmentCard[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return

    const loadDashboard = async () => {
      try {
        setLoading(true)

        // Fetch student's enrollments
        const response = await fetch('/api/campus/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
          },
        })

        if (response.ok) {
          const data = (await response.json()) as {
            enrollments?: EnrollmentCard[]
            stats?: StudentStats | null
          }
          setEnrollments(data.enrollments ?? [])
          setStats(data.stats ?? null)
        }
      } catch (error) {
        console.error('[Campus] Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [student])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge variant="default" data-oid="rsydilg">
            En Progreso
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-600" data-oid=":tsq2l4">
            Completado
          </Badge>
        )
      case 'not_started':
        return (
          <Badge variant="secondary" data-oid="1a_1f6m">
            No Iniciado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" data-oid="fo_fauy">
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-oid="e_3wkq7">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          data-oid="yexvl8f"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8" data-oid="r83wj-z">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2" data-oid="zx4r3q5">
        <h1 className="text-3xl font-bold" data-oid="2o.nmx8">
          Hola, {student?.firstName}!
        </h1>
        <p className="text-muted-foreground" data-oid="azu6q:y">
          Continua tu aprendizaje donde lo dejaste.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4" data-oid="2jrznux">
          <Card data-oid="ue8pxrq">
            <CardContent className="pt-6" data-oid="djd3z3b">
              <div className="flex items-center gap-4" data-oid="psv2as8">
                <div className="p-3 bg-blue-100 rounded-full" data-oid="lc7xal.">
                  <BookOpen className="h-5 w-5 text-blue-600" data-oid="s:idnm1" />
                </div>
                <div data-oid="yjkt4b1">
                  <p className="text-2xl font-bold" data-oid="rbybe-5">
                    {stats.totalCourses}
                  </p>
                  <p className="text-xs text-muted-foreground" data-oid="_u18r04">
                    Cursos Activos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-oid="mvbpnup">
            <CardContent className="pt-6" data-oid="n-vwrg9">
              <div className="flex items-center gap-4" data-oid="5l8roz5">
                <div className="p-3 bg-green-100 rounded-full" data-oid="9v8p.6q">
                  <CheckCircle2 className="h-5 w-5 text-green-600" data-oid="83l13l2" />
                </div>
                <div data-oid="82hndyq">
                  <p className="text-2xl font-bold" data-oid="zd5hd3-">
                    {stats.completedCourses}
                  </p>
                  <p className="text-xs text-muted-foreground" data-oid="tzf6cbh">
                    Completados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-oid="09yti:7">
            <CardContent className="pt-6" data-oid="gt6p_75">
              <div className="flex items-center gap-4" data-oid="w5fhppk">
                <div className="p-3 bg-orange-100 rounded-full" data-oid="l6in4-y">
                  <Flame className="h-5 w-5 text-orange-600" data-oid="h9i0-wy" />
                </div>
                <div data-oid="ez.v.1y">
                  <p className="text-2xl font-bold" data-oid="wswffo-">
                    {stats.currentStreak}
                  </p>
                  <p className="text-xs text-muted-foreground" data-oid="tasj8w:">
                    Dias Seguidos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-oid="dcx7ml1">
            <CardContent className="pt-6" data-oid="_ppa47v">
              <div className="flex items-center gap-4" data-oid="dihnl1t">
                <div className="p-3 bg-purple-100 rounded-full" data-oid="ygaph6o">
                  <Award className="h-5 w-5 text-purple-600" data-oid="7yafe06" />
                </div>
                <div data-oid="u6i_agy">
                  <p className="text-2xl font-bold" data-oid="9f6y5j3">
                    {stats.totalBadges}
                  </p>
                  <p className="text-xs text-muted-foreground" data-oid="og5eovu">
                    Insignias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enrollments Grid */}
      <div className="space-y-4" data-oid="b70bk9-">
        <h2 className="text-xl font-semibold" data-oid="gs:9rfi">
          Mis Cursos
        </h2>

        {enrollments.length === 0 ? (
          <Card data-oid="-2nodfj">
            <CardContent className="py-12 text-center" data-oid="oj1prp-">
              <BookOpen
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                data-oid="j2frof2"
              />
              <h3 className="text-lg font-medium mb-2" data-oid="d.u.ekv">
                Sin Cursos Activos
              </h3>
              <p className="text-muted-foreground mb-4" data-oid="m39_21v">
                Aun no estas matriculado en ningun curso.
              </p>
              <Button asChild data-oid="23r_gh1">
                <Link href="/campus/catalogo" data-oid="zl-aujf">
                  Explorar Cursos
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid="b8lor2v">
            {enrollments.map((enrollment) => (
              <Card
                key={enrollment.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
                data-oid="a27wjk1"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative" data-oid="lni6ec1">
                  {enrollment.courseThumbnail ? (
                    <img
                      src={enrollment.courseThumbnail}
                      alt={enrollment.courseTitle}
                      className="w-full h-full object-cover"
                      data-oid="s4qgjji"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      data-oid="f:fy2.z"
                    >
                      <BookOpen className="h-12 w-12 text-muted-foreground" data-oid=":.m-3:." />
                    </div>
                  )}
                  <div className="absolute top-2 right-2" data-oid="vrvs8_7">
                    {getStatusBadge(enrollment.status)}
                  </div>
                </div>

                <CardHeader className="pb-2" data-oid="q_bgcy:">
                  <CardTitle className="text-lg line-clamp-2" data-oid="34od8mt">
                    {enrollment.courseTitle}
                  </CardTitle>
                  <CardDescription data-oid="nvz5.yq">{enrollment.courseRunTitle}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4" data-oid="aak.2cc">
                  {/* Progress */}
                  <div className="space-y-2" data-oid="b2e8w73">
                    <div className="flex justify-between text-sm" data-oid="o6e9-z9">
                      <span className="text-muted-foreground" data-oid="g3r3581">
                        Progreso
                      </span>
                      <span className="font-medium" data-oid="zq2r:xw">
                        {enrollment.progressPercent}%
                      </span>
                    </div>
                    <Progress
                      value={enrollment.progressPercent}
                      className="h-2"
                      data-oid="3j:f7:q"
                    />
                  </div>

                  {/* Meta Info */}
                  <div
                    className="flex items-center justify-between text-sm text-muted-foreground"
                    data-oid="nw99bd:"
                  >
                    <span className="flex items-center gap-1" data-oid="-etqx7_">
                      <TrendingUp className="h-4 w-4" data-oid="3cmtcwx" />
                      {enrollment.completedModules}/{enrollment.totalModules} modulos
                    </span>
                    <span className="flex items-center gap-1" data-oid="ry:6b:3">
                      <Clock className="h-4 w-4" data-oid="w_ri-oy" />
                      {Math.round(enrollment.estimatedMinutesRemaining / 60)}h restantes
                    </span>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full" data-oid="46.xgr1">
                    <Link href={`/campus/cursos/${enrollment.id}`} data-oid="p-1iklr">
                      <PlayCircle className="mr-2 h-4 w-4" data-oid="1u1iius" />
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
  )
}

export default function CampusPage() {
  return (
    <RequireAuth data-oid="2c38wjs">
      <CampusDashboard data-oid="d61rjgl" />
    </RequireAuth>
  )
}
