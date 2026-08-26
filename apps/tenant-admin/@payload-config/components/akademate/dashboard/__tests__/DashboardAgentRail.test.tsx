import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  AGENT_GREETING_PROMPT,
  DashboardAgentRail,
} from '@payload-config/components/akademate/dashboard/DashboardAgentRail'

describe('DashboardAgentRail', () => {
  it('opens a navy chat with the CEP greeting and mock gestiones', () => {
    render(<DashboardAgentRail />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir agente IA' }))
    expect(screen.getByText('Agente Akademate')).toBeInTheDocument()
    expect(screen.getByText(/Soy el Agente IA de Akademate/)).toBeInTheDocument()
    expect(screen.getByText(/Crear una convocatoria nueva/)).toBeInTheDocument()
    expect(AGENT_GREETING_PROMPT).toContain('CEP FORMACIÓN')
    expect(AGENT_GREETING_PROMPT).toContain('Matricular un alumno')
    expect(screen.getByText('Quiero crear una convocatoria para el Curso de Ejemplo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Redimensionar agente')).toBeInTheDocument()
  })
})
