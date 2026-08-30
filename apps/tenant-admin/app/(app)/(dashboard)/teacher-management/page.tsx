'use client'

import React from 'react'
import {
  Phone,
  Mail,
  MoreHorizontal,
  Calendar,
  Briefcase,
  Plus,
  Edit,
  ExternalLink,
  Building2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react'

// Componentes oficiales de shadcn/ui del proyecto
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@payload-config/components/ui/breadcrumb'

export default function TeacherManagementPage() {
  return (
    <div className="w-full text-slate-900 space-y-6">
      {/* 1. Breadcrumbs de shadcn */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-500">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/profesores" className="hover:text-blue-600 transition-colors">Gestión Docente</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-bold text-slate-900">Ficha del Profesor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. Top Header con Título y Botones de Acción shadcn */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Ficha de Docente
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Información contractual, sedes habilitadas y convocatorias formativas activas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="gap-1.5 font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs h-9 px-4 rounded-xl">
            <ExternalLink className="h-4 w-4 text-slate-400" /> Ver perfil público
          </Button>
          <Button size="sm" className="gap-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 px-5 rounded-xl">
            <Edit className="h-4 w-4" /> Editar Docente
          </Button>
        </div>
      </div>

      {/* 3. Grid Principal 2 Columnas (4 / 8) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Perfil con Avatar y Contacto */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden h-full flex flex-col justify-between">
            <CardContent className="pt-7 pb-6 px-6 flex flex-col items-center text-center flex-1 justify-between">
              {/* Avatar con Badge Online Flotante */}
              <div className="flex flex-col items-center">
                <div className="relative mb-3">
                  <Avatar className="h-28 w-28 ring-4 ring-slate-100 shadow-md">
                    <AvatarImage
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                      alt="Prof. Carlos Mendoza"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-50 text-blue-700 text-2xl font-extrabold">CM</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  </div>
                </div>

                {/* Badge Rol Docente */}
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Docente Titular
                </span>

                {/* Nombre Principal */}
                <h2 className="text-xl font-extrabold text-slate-950 tracking-tight mt-2.5">
                  Prof. Carlos Mendoza
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Administración y Gestión de Empresas
                </p>
              </div>

              {/* Información de Contacto con Iconos shadcn */}
              <div className="mt-6 w-full border-t border-slate-100 pt-5 space-y-3.5 text-left">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-800">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-blue-600 border border-blue-100">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">+1 (123) 543-8950</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-800">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-blue-600 border border-blue-100">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">carlos.mendoza@cepformacion.es</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-800">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200/80">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">Sede Centro • Madrid</span>
                </div>
              </div>

              {/* Documentos Tags */}
              <div className="mt-6 w-full border-t border-slate-100 pt-5 text-left">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Acreditaciones y Documentos
                </h3>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200/80">
                    CV Verificado
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/80">
                    Certificado Docente
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Tarjetas de Detalles de Empleo y Convocatorias */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Detalles de Empleo */}
          <Card className="border-slate-200/80 shadow-xs bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                      Detalles de Empleo
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
                      Condiciones laborales, sede asignada y régimen de contratación
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-y-4 gap-x-12 sm:grid-cols-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo Contrato</span>
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">Tiempo Completo</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    En activo
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Código Empleado</span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">#DOC-0823</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sede Principal</span>
                  <span className="text-xs font-extrabold text-slate-900">Campus Centro • Madrid</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Convocatorias Asignadas */}
          <Card className="border-slate-200/80 shadow-xs bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-2xs">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                      Convocatorias Asignadas
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
                      Grupos y convocatorias activas para este docente
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-8 rounded-xl">
                  <Plus className="h-3.5 w-3.5" /> Asignar curso
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Cabecera de la tabla */}
              <div className="grid grid-cols-12 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100 px-2">
                <div className="col-span-6">Convocatoria / Módulo</div>
                <div className="col-span-3">Periodo</div>
                <div className="col-span-3 text-right pr-2">Estado</div>
              </div>

              {/* Filas */}
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-12 items-center py-3.5 group hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="col-span-6">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Administración y Finanzas (SCE)
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">Módulo: Gestión de Recursos Humanos</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Mar – Jun 2026
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-600 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center py-3.5 group hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="col-span-6">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Desarrollo de Aplicaciones Web
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">Módulo: Diseño de Interfaces</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Abr – Jul 2026
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-600 rounded-lg">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center py-3.5 group hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="col-span-6">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Marketing Digital & eCommerce
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">Módulo: Estrategia y Captación</p>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> May – Sep 2026
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      En Curso
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-600 rounded-lg">
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
