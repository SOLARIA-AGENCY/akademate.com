export type CourseType =
  | 'grado_medio'
  | 'grado_superior'
  | 'fp_basica'
  | 'certificado_profesionalidad'
  | 'curso_especializacion'
  | 'master'
  | 'default'

export interface CourseTypeConfig {
  label: string
  bgColor: string
  hoverColor: string
  textColor: string
  badgeVariant: 'default' | 'secondary' | 'success' | 'info' | 'warning' | 'outline'
}

export const COURSE_TYPE_CONFIG: Record<string, CourseTypeConfig> = {
  grado_medio:                   { label: 'Grado Medio',    bgColor: 'bg-blue-600',   hoverColor: 'hover:bg-blue-700',   textColor: 'text-white', badgeVariant: 'info'      },
  grado_superior:                { label: 'Grado Superior', bgColor: 'bg-purple-600', hoverColor: 'hover:bg-purple-700', textColor: 'text-white', badgeVariant: 'default'   },
  fp_basica:                     { label: 'FP Básica',      bgColor: 'bg-green-600',  hoverColor: 'hover:bg-green-700',  textColor: 'text-white', badgeVariant: 'success'   },
  certificado_profesionalidad:   { label: 'Cert. Prof.',    bgColor: 'bg-orange-600', hoverColor: 'hover:bg-orange-700', textColor: 'text-white', badgeVariant: 'warning'   },
  curso_especializacion:         { label: 'Especialización',bgColor: 'bg-red-600',    hoverColor: 'hover:bg-red-700',    textColor: 'text-white', badgeVariant: 'warning'   },
  master:                        { label: 'Máster',         bgColor: 'bg-indigo-600', hoverColor: 'hover:bg-indigo-700', textColor: 'text-white', badgeVariant: 'secondary' },
  default:                       { label: 'Curso',          bgColor: 'bg-gray-600',   hoverColor: 'hover:bg-gray-700',   textColor: 'text-white', badgeVariant: 'outline'   },
}

export function getCourseTypeConfig(type: string): CourseTypeConfig {
  return COURSE_TYPE_CONFIG[type] ?? COURSE_TYPE_CONFIG.default
}
