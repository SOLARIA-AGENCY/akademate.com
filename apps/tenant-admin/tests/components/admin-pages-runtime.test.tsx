import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RolesPage from '@/app/(dashboard)/administracion/roles/page';
import ActividadPage from '@/app/(dashboard)/administracion/actividad/page';

describe('Admin dashboard pages runtime', () => {
  it('renders roles page without runtime reference errors', () => {
    render(<RolesPage />);

    expect(screen.getByRole('heading', { name: /Roles y Permisos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Rol Personalizado/i })).toBeInTheDocument();
  });

  it('renders activity page without runtime reference errors', () => {
    render(<ActividadPage />);

    expect(screen.getByRole('heading', { name: /Registro de Actividad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rango de Fechas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar Log/i })).toBeInTheDocument();
  });
});
