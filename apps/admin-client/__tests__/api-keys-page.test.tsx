import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ApiKeysPage from '@/app/dashboard/api-keys/page'

// ── Mock data ────────────────────────────────────────────────────────────────

const mockKeys = [
  {
    id: 'key-1',
    name: 'Backend Production',
    key_prefix: 'ak_prod_abc',
    created_by: 'user-1',
    created_by_name: 'Carlos',
    scopes: ['read:tenants', 'write:tenants'],
    status: 'active' as const,
    last_used_at: '2026-03-17T10:00:00Z',
    revoked_at: null,
    revoked_by: null,
    expires_at: null,
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'key-2',
    name: 'CI/CD Pipeline',
    key_prefix: 'ak_ci_xyz',
    created_by: 'user-2',
    created_by_name: null,
    scopes: ['admin:*'],
    status: 'revoked' as const,
    last_used_at: null,
    revoked_at: '2026-03-10T12:00:00Z',
    revoked_by: 'user-1',
    expires_at: null,
    created_at: '2026-02-15T09:00:00Z',
  },
]

function setupFetchMock(keys: typeof mockKeys = mockKeys) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    (url: string, opts?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/api/ops/api-keys')) {
        if (opts?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: 'key-new',
                name: 'New Key',
                key: 'ak_full_secret_key_value_12345',
                key_prefix: 'ak_full',
                scopes: ['read:tenants'],
                status: 'active',
                created_at: new Date().toISOString(),
              }),
          })
        }
        if (opts?.method === 'DELETE') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        // GET
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(keys),
        })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
    }
  )
}

function setupEmptyFetchMock() {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ApiKeysPage', () => {
  beforeEach(() => {
    setupFetchMock()
  })

  it('renders page title "API Keys"', () => {
    render(<ApiKeysPage />)
    expect(screen.getByText('API Keys')).toBeInTheDocument()
  })

  it('shows "Nueva API Key" button', () => {
    render(<ApiKeysPage />)
    expect(screen.getByText('Nueva API Key')).toBeInTheDocument()
  })

  it('shows stats cards (Activas, Revocadas, Ultima creada)', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Activas')).toBeInTheDocument()
      expect(screen.getByText('Revocadas')).toBeInTheDocument()
      expect(screen.getByText('Ultima creada')).toBeInTheDocument()
    })
  })

  it('shows active and revoked key counts after loading', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      // 1 active key, 1 revoked key
      const activeCount = screen.getByText('1', { selector: '.text-green-400' })
      expect(activeCount).toBeInTheDocument()

      const revokedCount = screen.getByText('1', { selector: '.text-red-400' })
      expect(revokedCount).toBeInTheDocument()
    })
  })

  it('shows empty state when no keys exist', async () => {
    setupEmptyFetchMock()
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('No hay API keys creadas')).toBeInTheDocument()
      expect(
        screen.getByText('Crea tu primera API key para acceso programático')
      ).toBeInTheDocument()
    })
  })

  it('shows "Ninguna" for last created when no keys exist', async () => {
    setupEmptyFetchMock()
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Ninguna')).toBeInTheDocument()
    })
  })

  it('shows table with columns after loading keys', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Prefijo')).toBeInTheDocument()
      expect(screen.getByText('Creada por')).toBeInTheDocument()
      expect(screen.getByText('Fecha')).toBeInTheDocument()
      expect(screen.getByText('Ultimo uso')).toBeInTheDocument()
      expect(screen.getByText('Scopes')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()
    })
  })

  it('shows key names in the table', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Backend Production')).toBeInTheDocument()
      expect(screen.getByText('CI/CD Pipeline')).toBeInTheDocument()
    })
  })

  it('shows key prefixes in the table', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('ak_prod_abc...')).toBeInTheDocument()
      expect(screen.getByText('ak_ci_xyz...')).toBeInTheDocument()
    })
  })

  it('shows Activa status badge for active keys', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Activa')).toBeInTheDocument()
    })
  })

  it('shows Revocada status badge for revoked keys', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Revocada')).toBeInTheDocument()
    })
  })

  it('shows Revocar button only for active keys', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      const revokeButtons = screen.getAllByText('Revocar')
      // Only 1 active key should have a revoke button
      expect(revokeButtons).toHaveLength(1)
    })
  })

  it('shows creator name when available', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Carlos')).toBeInTheDocument()
    })
  })

  it('shows creator id when name is null', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('user-2')).toBeInTheDocument()
    })
  })

  it('create dialog opens when clicking "Nueva API Key"', async () => {
    render(<ApiKeysPage />)

    const button = screen.getByText('Nueva API Key')
    fireEvent.click(button)

    await waitFor(() => {
      // Dialog header
      const dialogHeaders = screen.getAllByText('Nueva API Key')
      expect(dialogHeaders.length).toBeGreaterThanOrEqual(2) // button + dialog title
    })
  })

  it('create dialog has name input', async () => {
    render(<ApiKeysPage />)

    fireEvent.click(screen.getByText('Nueva API Key'))

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(
        'Ej: Backend Production, CI/CD Pipeline...'
      )
      expect(nameInput).toBeInTheDocument()
    })
  })

  it('create dialog has scope checkboxes', async () => {
    render(<ApiKeysPage />)

    fireEvent.click(screen.getByText('Nueva API Key'))

    await waitFor(() => {
      expect(screen.getByText('Permisos (scopes)')).toBeInTheDocument()
      expect(screen.getByText('Leer tenants')).toBeInTheDocument()
      expect(screen.getByText('Escribir tenants')).toBeInTheDocument()
      expect(screen.getByText('Leer métricas')).toBeInTheDocument()
      expect(screen.getByText('Health checks')).toBeInTheDocument()
      expect(screen.getByText('Leer logs')).toBeInTheDocument()
      expect(screen.getByText('Admin completo')).toBeInTheDocument()
    })
  })

  it('create dialog has Crear API Key button', async () => {
    render(<ApiKeysPage />)

    fireEvent.click(screen.getByText('Nueva API Key'))

    await waitFor(() => {
      expect(screen.getByText('Crear API Key')).toBeInTheDocument()
    })
  })

  it('create dialog has Cancelar button', async () => {
    render(<ApiKeysPage />)

    fireEvent.click(screen.getByText('Nueva API Key'))

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })
  })

  it('shows created key banner with copy functionality after creation', async () => {
    render(<ApiKeysPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Backend Production')).toBeInTheDocument()
    })

    // Open create dialog
    fireEvent.click(screen.getByText('Nueva API Key'))

    // Fill name
    const nameInput = screen.getByPlaceholderText(
      'Ej: Backend Production, CI/CD Pipeline...'
    )
    fireEvent.change(nameInput, { target: { value: 'Test Key' } })

    // Select a scope
    const readTenantsCheckbox = screen.getByText('Leer tenants')
    fireEvent.click(readTenantsCheckbox)

    // Click create
    fireEvent.click(screen.getByText('Crear API Key'))

    await waitFor(() => {
      expect(screen.getByText('API Key creada correctamente')).toBeInTheDocument()
      expect(
        screen.getByText('Copia la key ahora. No podras verla de nuevo.')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ak_full_secret_key_value_12345')
      ).toBeInTheDocument()
    })
  })

  it('revoke confirmation dialog appears when clicking Revocar', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      expect(screen.getByText('Backend Production')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Revocar'))

    await waitFor(() => {
      expect(screen.getByText('Revocar API Key')).toBeInTheDocument()
      expect(
        screen.getByText(
          /Seguro que quieres revocar/
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          /Esta accion es irreversible/
        )
      ).toBeInTheDocument()
    })
  })

  it('scope badges render with correct color classes', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      // read:tenants should have blue color
      const readScope = screen.getByText('read:tenants')
      expect(readScope.className).toContain('text-blue-400')

      // write:tenants should have orange color
      const writeScope = screen.getByText('write:tenants')
      expect(writeScope.className).toContain('text-orange-400')

      // admin:* should have red color
      const adminScope = screen.getByText('admin:*')
      expect(adminScope.className).toContain('text-red-400')
    })
  })

  it('shows loading state initially', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    render(<ApiKeysPage />)
    expect(screen.getByText('Cargando API keys...')).toBeInTheDocument()
  })

  it('calls fetch for api-keys on mount', async () => {
    render(<ApiKeysPage />)

    await waitFor(() => {
      const fetchMock = global.fetch as ReturnType<typeof vi.fn>
      const calls = fetchMock.mock.calls.map((c: [string]) => c[0])
      expect(calls).toContain('/api/ops/api-keys')
    })
  })
})
