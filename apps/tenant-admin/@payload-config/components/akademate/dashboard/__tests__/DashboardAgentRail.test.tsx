import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  AGENT_GREETING_PROMPT,
  AGENT_QUICK_REPLIES,
  AGENT_RAIL_COLLAPSED_PX,
  DashboardAgentRail,
} from '@payload-config/components/akademate/dashboard/DashboardAgentRail'

describe('DashboardAgentRail', () => {
  it('opens a navy chat with greeting, coming-soon copy and clickable replies', () => {
    render(<DashboardAgentRail />)
    fireEvent.click(screen.getByRole('button', { name: 'Expandir agente' }))
    expect(screen.getByText('Agente Akademate')).toBeInTheDocument()
    expect(screen.getByText(/Soy el Agente IA de Akademate/)).toBeInTheDocument()
    expect(screen.getByText(/Próximamente estaré en marcha y funcionando/)).toBeInTheDocument()
    expect(AGENT_GREETING_PROMPT).toContain('CEP FORMACIÓN')
    expect(AGENT_RAIL_COLLAPSED_PX).toBe(40)
    expect(AGENT_QUICK_REPLIES).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Crear una convocatoria' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Matricular un alumno' }))
    expect(screen.getAllByText('Matricular un alumno').length).toBeGreaterThan(1)
    expect(screen.getByText(/La matrícula quedará asociada/)).toBeInTheDocument()
    expect(screen.queryByText('Quiero crear una convocatoria para el Curso de Ejemplo.')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Colapsar agente')).toBeInTheDocument()
    expect(screen.getByLabelText('Redimensionar agente')).toBeInTheDocument()
  })
})
