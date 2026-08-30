'use client'

import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  BookOpen,
  Briefcase,
  GraduationCap,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  Printer,
  Edit,
  ExternalLink,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  Sliders,
  ChevronRight,
  Layers,
  Palette,
  Type,
  LayoutGrid,
  ShieldCheck,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react'

// Componentes estándar de shadcn/ui
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@payload-config/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@payload-config/components/ui/breadcrumb'

export default function DesignHubPage() {
  const [activeTab, setActiveTab] = useState<string>('tokens')

  return (
    <div className="space-y-6">
      {/* Top Banner de Identidad del Design Hub */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60 font-semibold px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5" /> Akademate Design System v2.0
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-600/30 dark:border-emerald-700/50 font-semibold px-2.5 py-1">
              SaaS Premium Enterprise (shadcn/ui)
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-600/30 dark:border-purple-700/50 font-semibold px-2.5 py-1">
              Canvas: Slate-50 / Dark: Slate-950
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Design Hub & Live Showcase
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium">
            Entorno interactivo con tokens de diseño adaptativos, catálogo centralizado de badges y 4 vistas completas dual-theme.
          </p>
        </div>
      </div>

      {/* Navegación por Tabs shadcn/ui */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-2xl shadow-xs h-auto flex flex-wrap gap-1 w-full sm:w-auto">
          <TabsTrigger value="tokens" className="gap-2 font-bold text-xs py-2 px-3.5 rounded-xl text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
            <Palette className="h-4 w-4" /> 1. Tokens & Badges Kit
          </TabsTrigger>
          <TabsTrigger value="profesores" className="gap-2 font-bold text-xs py-2 px-3.5 rounded-xl text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
            <User className="h-4 w-4" /> 2. Ficha Docente
          </TabsTrigger>
          <TabsTrigger value="cursos" className="gap-2 font-bold text-xs py-2 px-3.5 rounded-xl text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
            <Layers className="h-4 w-4" /> 3. Catálogo Cursos
          </TabsTrigger>
          <TabsTrigger value="convocatoria" className="gap-2 font-bold text-xs py-2 px-3.5 rounded-xl text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
            <BookOpen className="h-4 w-4" /> 4. Detalle Convocatoria
          </TabsTrigger>
          <TabsTrigger value="planner" className="gap-2 font-bold text-xs py-2 px-3.5 rounded-xl text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xs transition-all">
            <LayoutGrid className="h-4 w-4" /> 5. Planner Visual
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Design Tokens & All Badges */}
        <TabsContent value="tokens" className="space-y-6">
          <TokensAndBadgesSection />
        </TabsContent>

        {/* Tab 2: Ficha Docente */}
        <TabsContent value="profesores" className="space-y-6">
          <TeacherProfileSection />
        </TabsContent>

        {/* Tab 3: Catálogo de Cursos */}
        <TabsContent value="cursos" className="space-y-6">
          <CourseCatalogSection />
        </TabsContent>

        {/* Tab 4: Convocatoria */}
        <TabsContent value="convocatoria" className="space-y-6">
          <ConvocatoriaDetailSection />
        </TabsContent>

        {/* Tab 5: Planner Visual */}
        <TabsContent value="planner" className="space-y-6">
          <PlannerVisualSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* =========================================================================
   1. CATÁLOGO COMPLETO DE TOKENS, ESTADOS & BADGES (shadcn/ui)
   ========================================================================= */
function TokensAndBadgesSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* 1. Todos los Badges y Estados Operativos */}
      <Card className="lg:col-span-12">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">Catálogo Centralizado de Estados & Badges</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">Todos los estados operativos con variantes de contraste adaptadas a Light y Dark mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Estados de Personal / Docentes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">1. Estados de Personal & Docentes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-600/20 dark:border-emerald-700/50 font-bold px-3 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online Active
              </Badge>
              <Badge className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-600/20 dark:border-emerald-700/50 font-bold px-3 py-1 text-xs">
                <Check className="h-3.5 w-3.5" />
                Activo
              </Badge>
              <Badge className="gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-600/20 dark:border-amber-700/50 font-bold px-3 py-1 text-xs">
                <Clock className="h-3.5 w-3.5" />
                Baja Temporal
              </Badge>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold px-3 py-1 text-xs">
                Inactivo
              </Badge>
              <Badge className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-600/20 dark:border-rose-700/50 font-bold px-3 py-1 text-xs">
                Sin Área Habilitada
              </Badge>
            </div>
          </div>

          {/* Estados de Convocatorias & Cursos */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">2. Estados de Convocatorias & Cursos</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-600/20 dark:border-emerald-700/50 font-bold px-3 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Matrícula Abierta
              </Badge>
              <Badge className="gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-600/20 dark:border-blue-700/50 font-bold px-3 py-1 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                En Curso
              </Badge>
              <Badge className="gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-600/20 dark:border-amber-700/50 font-bold px-3 py-1 text-xs">
                <Clock className="h-3.5 w-3.5" />
                Sin Publicar (Borrador)
              </Badge>
              <Badge className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-600/20 dark:border-purple-700/50 font-bold px-3 py-1 text-xs">
                Finalizado
              </Badge>
              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold px-3 py-1 text-xs">
                Privado
              </Badge>
            </div>
          </div>

          {/* Tipos de Financiación / Áreas */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">3. Tipología de Financiación & Modalidad</h4>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-3 py-1 text-xs font-bold">
                SCE Ocupados
              </span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold">
                SCE Desempleados
              </span>
              <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-3 py-1 text-xs font-bold">
                Privado / Bonificado
              </span>
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1 text-xs font-bold">
                Teleformación
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Jerarquía Tipográfica y Botones */}
      <Card className="lg:col-span-6">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">Jerarquía Tipográfica (Manrope)</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Heading 1 (24-30px / 800)</span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Teacher Management</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Card Header (16px / 700)</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Detalles de Empleo</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Label (11px / 700 Uppercase)</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">TIPO DE CONTRATO</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Data Value (14px / 800)</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Tiempo Completo</span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-6">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">Botones & Acciones shadcn/ui</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs rounded-xl">
              <Plus className="h-4 w-4" /> Botón Primario
            </Button>
            <Button size="sm" variant="outline" className="border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold gap-1.5 shadow-xs rounded-xl">
              <Edit className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Secundario Outline
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold rounded-xl">
              Ghost Action
            </Button>
            <Button size="sm" variant="outline" className="border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold rounded-xl">
              Peligro / Baja
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Todos los botones integran foco accesible, estados hover/active fluidos y radios consistentes <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">rounded-xl</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* =========================================================================
   2. PÁGINA 1: FICHA DOCENTE (Responsiva en Modo Mock)
   ========================================================================= */
function TeacherProfileSection() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb shadcn */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          <BreadcrumbItem><BreadcrumbLink href="#" className="hover:text-slate-900 dark:hover:text-slate-200">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="#" className="hover:text-slate-900 dark:hover:text-slate-200">Gestión Docente</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage className="font-bold text-slate-900 dark:text-slate-100">Ficha del Profesor</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Ficha de Docente
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Información contractual, sedes habilitadas y convocatorias formativas activas.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs rounded-xl">
            <ExternalLink className="h-4 w-4 mr-1 text-slate-400 dark:text-slate-500" /> Ver perfil público
          </Button>
          <Button size="sm" className="font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs rounded-xl">
            <Edit className="h-4 w-4 mr-1.5" /> Editar Docente
          </Button>
        </div>
      </div>

      {/* Grid Responsivo 2 Columnas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Perfil con Avatar Grande */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="rounded-2xl overflow-hidden h-full flex flex-col justify-between">
            <CardContent className="pt-7 pb-6 px-6 flex flex-col items-center text-center flex-1 justify-between">
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <Avatar className="h-28 w-28 ring-4 ring-slate-100 dark:ring-slate-800 shadow-md">
                    <AvatarImage
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                      alt="Prof. Carlos Mendoza"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-2xl font-extrabold">CM</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-600/40 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-600/40">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Docente Titular
                </span>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2.5">
                  Prof. Carlos Mendoza
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Administración y Gestión de Empresas
                </p>
              </div>

              {/* Información de Contacto */}
              <div className="mt-6 w-full border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-3.5 text-left">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">+1 (123) 543-8950</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">carlos.mendoza@cepformacion.es</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">Sede Centro • Madrid</span>
                </div>
              </div>

              {/* Tags / Documentos */}
              <div className="mt-6 w-full border-t border-slate-100 dark:border-slate-800/80 pt-5 text-left">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Acreditaciones y Documentos
                </h4>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    CV Verificado
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50">
                    Certificado Docente
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Detalles & Convocatorias */}
        <div className="space-y-6 lg:col-span-8">
          {/* Detalles de Empleo */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shadow-2xs">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      Detalles de Empleo
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Condiciones laborales, sede asignada y régimen de contratación
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-y-4 gap-x-12 sm:grid-cols-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tipo Contrato</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">Tiempo Completo</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-600/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    En activo
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Código Empleado</span>
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/80 dark:border-blue-800/50">#DOC-0823</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sede Principal</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">Campus Centro • Madrid</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Convocatorias Asignadas */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 shadow-2xs">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      Convocatorias Asignadas
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Grupos y convocatorias activas para este docente
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 h-8 rounded-xl">
                  <Plus className="h-3.5 w-3.5" /> Asignar curso
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800/80 px-2">
                <div className="col-span-6">Convocatoria / Módulo</div>
                <div className="col-span-3">Periodo</div>
                <div className="col-span-3 text-right pr-2">Estado</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <div className="grid grid-cols-12 items-center py-3.5 group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors">
                  <div className="col-span-6">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Administración y Finanzas (SCE)
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Módulo: Gestión de Recursos Humanos</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> Mar – Jun 2026
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-600/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center py-3.5 group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors">
                  <div className="col-span-6">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Desarrollo de Aplicaciones Web
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Módulo: Diseño de Interfaces</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> Abr – Jul 2026
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-600/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center py-3.5 group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors">
                  <div className="col-span-6">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Marketing Digital & eCommerce
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Módulo: Estrategia y Captación</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> May – Sep 2026
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-600/40">
                      En Curso
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   3. PÁGINA 2: CATÁLOGO DE CURSOS (Cards Premium con grid responsivo)
   ========================================================================= */
function CourseCatalogSection() {
  const coursesMock = [
    {
      id: 1,
      title: 'Desarrollo Web Full Stack Next.js 15 & Tailwind v4',
      code: 'IFCD0210',
      category: 'Informática y Comunicaciones',
      modality: 'Presencial',
      hours: 450,
      badgeVariant: 'emerald' as const,
      typeLabel: 'SCE Desempleados',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      convocatorias: 3,
    },
    {
      id: 2,
      title: 'Gestión Contable y Facturación Electrónica',
      code: 'ADGD0108',
      category: 'Administración y Gestión',
      modality: 'Teleformación',
      hours: 210,
      badgeVariant: 'blue' as const,
      typeLabel: 'SCE Ocupados',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      convocatorias: 2,
    },
    {
      id: 3,
      title: 'Masterclass: Arquitectura Cloud con Kubernetes',
      code: 'PRIV-2027',
      category: 'Tecnología Avanzada',
      modality: 'Semipresencial',
      hours: 120,
      badgeVariant: 'purple' as const,
      typeLabel: 'Privado Bonificado',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      convocatorias: 1,
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header & Filtros Rápidos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Catálogo de Cursos & Programas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">3 planes activos en este centro académico</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs rounded-xl">
            <Plus className="h-4 w-4" /> Crear Nuevo Curso
          </Button>
        </div>
      </div>

      {/* Grid de Tarjetas de Curso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesMock.map((course) => (
          <Card key={course.id} className="overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-200">
            {/* Foto de Portada con Badge de Tipo */}
            <div className="relative h-44 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3">
                <span className="rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700">
                  {course.typeLabel}
                </span>
              </div>
            </div>

            {/* Contenido de la Card */}
            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1.5">
                  <span>{course.category}</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{course.code}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {course.title}
                </h3>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> {course.hours} horas</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> {course.convocatorias} convocatorias</span>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/80 p-3.5 px-5 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Ver detalle de curso <ChevronRight className="h-3.5 w-3.5" />
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* =========================================================================
   4. PÁGINA 3: DETALLE DE CONVOCATORIA
   ========================================================================= */
function ConvocatoriaDetailSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Convocatorias</span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">QA-0823-2018</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Curso QA-0823-2018 EDIT
            </h2>
            <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-600/20 dark:border-amber-700/50 font-bold">
              Sin publicar
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs rounded-xl">
            <CheckCircle2 className="h-3.5 w-3.5" /> Publicar Convocatoria
          </Button>
          <Button size="sm" variant="outline" className="border-slate-200/90 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 gap-1.5 rounded-xl">
            <Edit className="h-3.5 w-3.5" /> Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                  <FileText className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Resumen de convocatoria</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-600/20 dark:border-emerald-700/50 font-bold">
                Matrícula abierta
              </Badge>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                El curso intake del curso programado QA-0823 llega de una actualización reciente adaptada para el periodo académico actual.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-xs rounded-xl">
                <CheckCircle2 className="h-4 w-4" /> Publicarlo de convocatoria
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fechas de Inicio y Fin</div>
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">10 ene 2027 – 31 ene 2027</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Precio de Matrícula</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">450,00 €</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   5. PÁGINA 4: PLANNER VISUAL
   ========================================================================= */
function PlannerVisualSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Planner Visual & Ocupación de Aulas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Gestión de franjas horarias y capacidad</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs rounded-xl">
            <Plus className="h-4 w-4" /> Nueva Asignación
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['Todos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, idx) => (
          <Button
            key={day}
            size="sm"
            variant={idx === 0 ? 'default' : 'outline'}
            className={`font-bold rounded-xl ${idx === 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
          >
            {day}
          </Button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Aula Principal 1 (Capacidad: 20 plazas)</span>
          <span className="text-slate-500 dark:text-slate-400">Sede Centro</span>
        </div>

        <div className="grid grid-cols-12 border-b border-slate-100 dark:border-slate-800 p-6 items-center">
          <div className="col-span-12 sm:col-span-3 text-xs font-extrabold text-slate-900 dark:text-slate-100 mb-2 sm:mb-0">
            08:00 - 14:00 (Mañana)
          </div>
          <div className="col-span-12 sm:col-span-9">
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 p-4 shadow-xs border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-600/20 dark:border-rose-700/50 font-bold text-[10px]">
                    Cursos Privados
                  </Badge>
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-600/20 dark:border-emerald-700/50 font-bold text-[10px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" /> Publicado
                  </Badge>
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">18/20 Plazas</span>
              </div>
              <div className="mt-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Curso Especialista en QA Automatizado
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                LUN, MIÉ, VIE • Prof. Carlos Mendoza
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
