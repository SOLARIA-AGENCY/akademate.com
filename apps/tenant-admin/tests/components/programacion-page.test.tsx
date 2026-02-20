import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProgramacionPage from '@/app/(dashboard)/programacion/page';

describe('ProgramacionPage', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/convocatorias')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: 1,
                  cursoNombre: 'Gestión Académica',
                  cursoTipo: 'PRG-101',
                  profesor: {
                    id: 2,
                    staff_type: 'profesor',
                    first_name: 'Lucia',
                    last_name: 'Ortega',
                    full_name: 'Lucia Ortega',
                    email: 'lucia.ortega@cep.es',
                  },
                  campusNombre: 'Campus Madrid Centro',
                  modalidad: 'Aula 1',
                  horario: 'Lunes 09:00-11:00',
                  fechaInicio: '2026-03-01T00:00:00.000Z',
                  fechaFin: '2026-03-30T00:00:00.000Z',
                  plazasTotales: 30,
                  plazasOcupadas: 12,
                  estado: 'enrollment_open',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('renders teacher name when API returns populated instructor object', async () => {
    render(<ProgramacionPage />);

    await waitFor(() => {
      expect(screen.getByText('Lucia Ortega')).toBeInTheDocument();
    });

    expect(screen.getByText('Gestión Académica')).toBeInTheDocument();
  });
});
