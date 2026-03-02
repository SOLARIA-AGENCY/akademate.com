import { describe, it, expect } from 'vitest'
// Import directly bypassing the alias so we test the real source
import { traducirEstado } from '../../@payload-config/lib/estados'

describe('traducirEstado', () => {
  // --- Publicación / contenido ---
  describe('estados de contenido', () => {
    it('published → Publicado / success', () => {
      const result = traducirEstado('published')
      expect(result.label).toBe('Publicado')
      expect(result.variant).toBe('success')
    })

    it('draft → Borrador / neutral', () => {
      const result = traducirEstado('draft')
      expect(result.label).toBe('Borrador')
      expect(result.variant).toBe('neutral')
    })
  })

  // --- Matrícula / inscripción ---
  describe('estados de matrícula e inscripción', () => {
    it('active → Activo / success', () => {
      const result = traducirEstado('active')
      expect(result.label).toBe('Activo')
      expect(result.variant).toBe('success')
    })

    it('inactive → Inactivo / neutral', () => {
      const result = traducirEstado('inactive')
      expect(result.label).toBe('Inactivo')
      expect(result.variant).toBe('neutral')
    })

    it('completed → Completado / info', () => {
      const result = traducirEstado('completed')
      expect(result.label).toBe('Completado')
      expect(result.variant).toBe('info')
    })

    it('pending → Pendiente / warning', () => {
      const result = traducirEstado('pending')
      expect(result.label).toBe('Pendiente')
      expect(result.variant).toBe('warning')
    })

    it('confirmed → Confirmado / info', () => {
      const result = traducirEstado('confirmed')
      expect(result.label).toBe('Confirmado')
      expect(result.variant).toBe('info')
    })

    it('cancelled → Cancelado / destructive', () => {
      const result = traducirEstado('cancelled')
      expect(result.label).toBe('Cancelado')
      expect(result.variant).toBe('destructive')
    })

    it('enrollment_open → Abierta / success', () => {
      const result = traducirEstado('enrollment_open')
      expect(result.label).toBe('Abierta')
      expect(result.variant).toBe('success')
    })

    it('enrollment_closed → Cerrada / neutral', () => {
      const result = traducirEstado('enrollment_closed')
      expect(result.label).toBe('Cerrada')
      expect(result.variant).toBe('neutral')
    })

    it('in_progress → En curso / info', () => {
      const result = traducirEstado('in_progress')
      expect(result.label).toBe('En curso')
      expect(result.variant).toBe('info')
    })
  })

  // --- Campañas ---
  describe('estados de campaña', () => {
    it('activa → Activa / success', () => {
      const result = traducirEstado('activa')
      expect(result.label).toBe('Activa')
      expect(result.variant).toBe('success')
    })

    it('pausada → Pausada / warning', () => {
      const result = traducirEstado('pausada')
      expect(result.label).toBe('Pausada')
      expect(result.variant).toBe('warning')
    })

    it('finalizada → Finalizada / info', () => {
      const result = traducirEstado('finalizada')
      expect(result.label).toBe('Finalizada')
      expect(result.variant).toBe('info')
    })

    it('archivada → Archivada / neutral', () => {
      const result = traducirEstado('archivada')
      expect(result.label).toBe('Archivada')
      expect(result.variant).toBe('neutral')
    })
  })

  // --- Matrículas ---
  describe('estados de matrícula', () => {
    it('aceptada → Aceptada / success', () => {
      const result = traducirEstado('aceptada')
      expect(result.label).toBe('Aceptada')
      expect(result.variant).toBe('success')
    })

    it('rechazada → Rechazada / destructive', () => {
      const result = traducirEstado('rechazada')
      expect(result.label).toBe('Rechazada')
      expect(result.variant).toBe('destructive')
    })
  })

  // --- Convocatorias ---
  describe('estados de convocatoria', () => {
    it('abierta → Abierta / success', () => {
      const result = traducirEstado('abierta')
      expect(result.label).toBe('Abierta')
      expect(result.variant).toBe('success')
    })

    it('planificada → Planificada / info', () => {
      const result = traducirEstado('planificada')
      expect(result.label).toBe('Planificada')
      expect(result.variant).toBe('info')
    })

    it('lista_espera → Lista de espera / warning', () => {
      const result = traducirEstado('lista_espera')
      expect(result.label).toBe('Lista de espera')
      expect(result.variant).toBe('warning')
    })

    it('cerrada → Cerrada / neutral', () => {
      const result = traducirEstado('cerrada')
      expect(result.label).toBe('Cerrada')
      expect(result.variant).toBe('neutral')
    })
  })

  // --- Fallback ---
  describe('fallback para estados desconocidos', () => {
    it('estado desconocido usa el literal como label', () => {
      const result = traducirEstado('estado_inventado')
      expect(result.label).toBe('estado_inventado')
    })

    it('estado desconocido usa variant outline', () => {
      const result = traducirEstado('estado_inventado')
      expect(result.variant).toBe('outline')
    })

    it('cadena vacía → label vacío / outline', () => {
      const result = traducirEstado('')
      expect(result.label).toBe('')
      expect(result.variant).toBe('outline')
    })

    it('estado en mayúsculas no coincide (case-sensitive)', () => {
      const result = traducirEstado('ACTIVE')
      expect(result.variant).toBe('outline')
      expect(result.label).toBe('ACTIVE')
    })

    it('estado con espacios no coincide', () => {
      const result = traducirEstado(' active ')
      expect(result.variant).toBe('outline')
    })
  })

  // --- Garantías de cobertura total de variantes ---
  describe('cobertura de todos los BadgeSemanticVariant usados', () => {
    it('al menos un estado usa variant success', () => {
      expect(traducirEstado('active').variant).toBe('success')
    })

    it('al menos un estado usa variant neutral', () => {
      expect(traducirEstado('inactive').variant).toBe('neutral')
    })

    it('al menos un estado usa variant warning', () => {
      expect(traducirEstado('pending').variant).toBe('warning')
    })

    it('al menos un estado usa variant info', () => {
      expect(traducirEstado('completed').variant).toBe('info')
    })

    it('al menos un estado usa variant destructive', () => {
      expect(traducirEstado('cancelled').variant).toBe('destructive')
    })

    it('fallback produce variant outline', () => {
      expect(traducirEstado('__unknown__').variant).toBe('outline')
    })
  })
})
