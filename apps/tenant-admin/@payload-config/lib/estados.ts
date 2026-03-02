// apps/tenant-admin/@payload-config/lib/estados.ts

export type BadgeSemanticVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'

export interface EstadoConfig {
  label: string
  variant: BadgeSemanticVariant
}

const ESTADOS: Record<string, EstadoConfig> = {
  // Publicación / contenido
  published:         { label: 'Publicado',    variant: 'success'  },
  draft:             { label: 'Borrador',     variant: 'neutral'  },
  // Matrícula / inscripción
  active:            { label: 'Activo',       variant: 'success'  },
  inactive:          { label: 'Inactivo',     variant: 'neutral'  },
  completed:         { label: 'Completado',   variant: 'info'     },
  pending:           { label: 'Pendiente',    variant: 'warning'  },
  confirmed:         { label: 'Confirmado',   variant: 'info'     },
  cancelled:         { label: 'Cancelado',    variant: 'destructive' },
  enrollment_open:   { label: 'Abierta',      variant: 'success'  },
  enrollment_closed: { label: 'Cerrada',      variant: 'neutral'  },
  in_progress:       { label: 'En curso',     variant: 'info'     },
  // Campañas
  activa:            { label: 'Activa',       variant: 'success'  },
  pausada:           { label: 'Pausada',      variant: 'warning'  },
  finalizada:        { label: 'Finalizada',   variant: 'info'     },
  archivada:         { label: 'Archivada',    variant: 'neutral'  },
  // Matrículas
  aceptada:          { label: 'Aceptada',     variant: 'success'  },
  rechazada:         { label: 'Rechazada',    variant: 'destructive' },
  // Convocatorias
  abierta:           { label: 'Abierta',      variant: 'success'  },
  planificada:       { label: 'Planificada',  variant: 'info'     },
  lista_espera:      { label: 'Lista de espera', variant: 'warning' },
  cerrada:           { label: 'Cerrada',      variant: 'neutral'  },
}

export function traducirEstado(estado: string): EstadoConfig {
  return ESTADOS[estado] ?? { label: estado, variant: 'outline' }
}
