import { describe, expect, it, vi } from 'vitest'
import {
  createAccountingReadSourceResolver as createAccountingReadSourceResolverImpl,
  isAccountingSecretReference,
  type AccountingReadClientFactory,
  type AccountingReadSourceResolverOptions,
  type ReviewedAccountingSourceRegistration,
} from '../src'

const tenantId = '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10'

function registration(index: number): ReviewedAccountingSourceRegistration {
  return {
    tenantId,
    legalEntityId: `018f47a2-4a7b-7d02-8a2f-9d4ab1c25e1${index}`,
    connectionId: `018f47a2-4a7b-7d03-aa2f-9d4ab1c25e2${index}`,
    provider: `provider-${index}`,
    externalCompanyId: `company-${index}`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    secretReference: `op://cep/accounting/entity-${index}`,
    reviewReference: `review://finance/accounting/entity-${index}/v1`,
  }
}

function factory(provider: string): AccountingReadClientFactory & {
  readonly createReadClient: ReturnType<typeof vi.fn>
} {
  return {
    provider,
    createReadClient: vi.fn().mockImplementation(async (input) => ({
      provider,
      listTransactions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      authorization: {
        access: 'read_only',
        grantedPermissions: ['transactions:read'],
        tenantId: input.tenantId,
        legalEntityId: input.legalEntityId,
        connectionId: input.connectionId,
        externalCompanyId: input.externalCompanyId,
      },
    })),
  }
}

function requiredEntities(registrations: readonly ReviewedAccountingSourceRegistration[]) {
  return registrations.map(({ tenantId: currentTenantId, legalEntityId }) => ({
    tenantId: currentTenantId,
    legalEntityId,
  }))
}

function createAccountingReadSourceResolver(
  options: Omit<AccountingReadSourceResolverOptions, 'requiredEntities'> & {
    readonly requiredEntities?: AccountingReadSourceResolverOptions['requiredEntities']
  }
) {
  return createAccountingReadSourceResolverImpl({
    ...options,
    requiredEntities: options.requiredEntities ?? requiredEntities(options.registrations),
  })
}

function key(source: ReviewedAccountingSourceRegistration) {
  return {
    tenantId: source.tenantId,
    legalEntityId: source.legalEntityId,
    connectionId: source.connectionId,
  }
}

function authorization(source: ReviewedAccountingSourceRegistration) {
  return {
    access: 'read_only' as const,
    grantedPermissions: ['transactions:read'] as const,
    tenantId: source.tenantId,
    legalEntityId: source.legalEntityId,
    connectionId: source.connectionId,
    externalCompanyId: source.externalCompanyId,
  }
}

describe('reviewed accounting source registry', () => {
  it('resolves exactly one reviewed scope without exposing its secret reference', async () => {
    const sur = registration(3)
    const providerFactory = factory(sur.provider)
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    const resolved = await resolver.resolve({
      tenantId: sur.tenantId,
      legalEntityId: sur.legalEntityId,
      connectionId: sur.connectionId,
    })

    expect(providerFactory.createReadClient).toHaveBeenCalledWith({
      tenantId: sur.tenantId,
      legalEntityId: sur.legalEntityId,
      connectionId: sur.connectionId,
      provider: sur.provider,
      externalCompanyId: sur.externalCompanyId,
      secretReference: sur.secretReference,
    })
    expect(resolved.scope).toEqual({
      tenantId: sur.tenantId,
      legalEntityId: sur.legalEntityId,
      connectionId: sur.connectionId,
      provider: sur.provider,
      externalCompanyId: sur.externalCompanyId,
      integrationMode: 'read_only',
      connectionStatus: 'active',
    })
    expect(JSON.stringify(resolved)).not.toContain(sur.secretReference)
    expect(JSON.stringify(resolved)).not.toContain(sur.reviewReference)
  })

  it('rejects unexpected adapter fields instead of hiding possible write capabilities', async () => {
    const sur = registration(3)
    const listTransactions = vi.fn().mockResolvedValue({ items: [], nextCursor: null })
    const providerFactory = factory(sur.provider)
    providerFactory.createReadClient.mockResolvedValue({
      provider: sur.provider,
      listTransactions,
      authorization: authorization(sur),
      credential: 'token=must-not-leak',
      secretReference: sur.secretReference,
    } as never)
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    await expect(resolver.resolve(key(sur))).rejects.toMatchObject({
      code: 'ACCOUNTING_SOURCE_CLIENT_INVALID',
    })
    expect(listTransactions).not.toHaveBeenCalled()
  })

  it('rejects cross-entity resolution before invoking a provider factory', async () => {
    const sur = registration(3)
    const norte = registration(1)
    const providerFactory = factory(sur.provider)
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    await expect(
      resolver.resolve({
        tenantId: norte.tenantId,
        legalEntityId: norte.legalEntityId,
        connectionId: sur.connectionId,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_SOURCE_SCOPE_NOT_REVIEWED' })
    expect(providerFactory.createReadClient).not.toHaveBeenCalled()
  })

  it.each(['raw-token', 'Bearer secret', 'https://vault.example/secret', '', ' op://secret'])(
    'rejects a raw credential or unsupported secret locator: %s',
    (secretReference) => {
      const sur = { ...registration(3), secretReference }
      const providerFactory = factory(sur.provider)

      expect(() =>
        createAccountingReadSourceResolver({
          registrations: [sur],
          factories: [providerFactory],
        })
      ).toThrow(expect.objectContaining({ code: 'ACCOUNTING_SOURCE_PLAN_INVALID' }))
      expect(providerFactory.createReadClient).not.toHaveBeenCalled()
    }
  )

  it('validates every registration before any provider resolution can occur', () => {
    const sur = registration(3)
    const invalid = { ...registration(1), connectionStatus: 'inactive' as const }
    const factories = [factory(sur.provider), factory(invalid.provider)]

    expect(() =>
      createAccountingReadSourceResolver({ registrations: [sur, invalid], factories })
    ).toThrow(expect.objectContaining({ code: 'ACCOUNTING_CONNECTION_INACTIVE' }))
    for (const providerFactory of factories) {
      expect(providerFactory.createReadClient).not.toHaveBeenCalled()
    }
  })

  it.each([
    {
      label: 'entity',
      change: (first: ReviewedAccountingSourceRegistration) => ({
        ...registration(2),
        legalEntityId: first.legalEntityId,
      }),
      code: 'ACCOUNTING_SOURCE_REQUIRED_ENTITY_DUPLICATE',
    },
    {
      label: 'connection',
      change: (first: ReviewedAccountingSourceRegistration) => ({
        ...registration(2),
        connectionId: first.connectionId,
      }),
      code: 'ACCOUNTING_SOURCE_SHARED_CONNECTION',
    },
    {
      label: 'external company',
      change: (first: ReviewedAccountingSourceRegistration) => ({
        ...registration(2),
        provider: first.provider,
        externalCompanyId: first.externalCompanyId,
      }),
      code: 'ACCOUNTING_SOURCE_SHARED_EXTERNAL_COMPANY',
    },
  ])('rejects a shared $label binding across entities', ({ change, code }) => {
    const first = registration(1)
    const second = change(first)
    const factories = [factory(first.provider)]
    if (second.provider !== first.provider) factories.push(factory(second.provider))

    expect(() =>
      createAccountingReadSourceResolver({ registrations: [first, second], factories })
    ).toThrow(expect.objectContaining({ code }))
  })

  it('fails closed when no adapter exists for a reviewed provider', () => {
    const sur = registration(3)

    expect(() =>
      createAccountingReadSourceResolver({ registrations: [sur], factories: [] })
    ).toThrow(expect.objectContaining({ code: 'ACCOUNTING_SOURCE_PROVIDER_NOT_REGISTERED' }))
  })

  it('rejects a missing required entity before any adapter or secret resolution', () => {
    const norte = registration(1)
    const sur = registration(3)
    const providerFactories = [factory(norte.provider), factory(sur.provider)]

    expect(() =>
      createAccountingReadSourceResolverImpl({
        registrations: [norte],
        requiredEntities: requiredEntities([norte, sur]),
        factories: providerFactories,
      })
    ).toThrow(expect.objectContaining({ code: 'ACCOUNTING_SOURCE_ENTITY_COVERAGE_MISMATCH' }))
    for (const providerFactory of providerFactories) {
      expect(providerFactory.createReadClient).not.toHaveBeenCalled()
    }
  })

  it.each([
    {
      field: 'secret reference',
      change: (first: ReviewedAccountingSourceRegistration) => ({
        ...registration(2),
        secretReference: first.secretReference,
      }),
      code: 'ACCOUNTING_SOURCE_SHARED_SECRET_REFERENCE',
    },
    {
      field: 'review reference',
      change: (first: ReviewedAccountingSourceRegistration) => ({
        ...registration(2),
        reviewReference: first.reviewReference,
      }),
      code: 'ACCOUNTING_SOURCE_SHARED_REVIEW_REFERENCE',
    },
  ])('rejects a shared $field across independent entities', ({ change, code }) => {
    const first = registration(1)
    const second = change(first)
    const providerFactories = [factory(first.provider), factory(second.provider)]

    expect(() =>
      createAccountingReadSourceResolver({
        registrations: [first, second],
        factories: providerFactories,
      })
    ).toThrow(expect.objectContaining({ code }))
    for (const providerFactory of providerFactories) {
      expect(providerFactory.createReadClient).not.toHaveBeenCalled()
    }
  })

  it('redacts adapter creation failures and never returns their message', async () => {
    const sur = registration(3)
    const providerFactory = factory(sur.provider)
    providerFactory.createReadClient.mockRejectedValue(
      new Error('op://cep/accounting/entity-3 token=must-not-leak')
    )
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    const failure = await resolver
      .resolve({
        tenantId: sur.tenantId,
        legalEntityId: sur.legalEntityId,
        connectionId: sur.connectionId,
      })
      .catch((error: unknown) => error)

    expect(failure).toMatchObject({
      code: 'ACCOUNTING_SOURCE_CLIENT_CREATION_FAILED',
      safeSummary: 'Accounting read client creation failed.',
    })
    expect(JSON.stringify(failure)).not.toContain('must-not-leak')
    expect(String(failure)).not.toContain(sur.secretReference)
  })

  it('rejects a client for a different provider after resolution', async () => {
    const sur = registration(3)
    const providerFactory = factory(sur.provider)
    providerFactory.createReadClient.mockResolvedValue({
      provider: 'provider-foreign',
      listTransactions: vi.fn(),
      authorization: authorization(sur),
    })
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    await expect(
      resolver.resolve({
        tenantId: sur.tenantId,
        legalEntityId: sur.legalEntityId,
        connectionId: sur.connectionId,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_PROVIDER_MISMATCH' })
  })

  it.each([
    { access: 'read_write', grantedPermissions: ['transactions:read'] },
    { access: 'read_only', grantedPermissions: ['transactions:read', 'invoices:write'] },
    { access: 'read_only', grantedPermissions: ['invoices:write'] },
  ])('rejects provider write authority before transaction I/O: %o', async (permissionChange) => {
    const sur = registration(3)
    const listTransactions = vi.fn()
    const providerFactory = factory(sur.provider)
    providerFactory.createReadClient.mockResolvedValue({
      provider: sur.provider,
      listTransactions,
      authorization: { ...authorization(sur), ...permissionChange },
    } as never)
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    await expect(resolver.resolve(key(sur))).rejects.toMatchObject({
      code: 'ACCOUNTING_SOURCE_WRITE_PERMISSION_FORBIDDEN',
    })
    expect(listTransactions).not.toHaveBeenCalled()
  })

  it.each([
    { grantedPermissions: [] },
    { grantedPermissions: ['invoices:read'] },
    { grantedPermissions: ['transactions:read', 'invoices:read'] },
  ])(
    'rejects an incomplete or broadened read grant before transaction I/O: %o',
    async ({ grantedPermissions }) => {
      const sur = registration(3)
      const listTransactions = vi.fn()
      const providerFactory = factory(sur.provider)
      providerFactory.createReadClient.mockResolvedValue({
        provider: sur.provider,
        listTransactions,
        authorization: { ...authorization(sur), grantedPermissions },
      } as never)
      const resolver = createAccountingReadSourceResolver({
        registrations: [sur],
        factories: [providerFactory],
      })

      await expect(resolver.resolve(key(sur))).rejects.toMatchObject({
        code: 'ACCOUNTING_SOURCE_READ_PERMISSION_REQUIRED',
      })
      expect(listTransactions).not.toHaveBeenCalled()
    }
  )

  it.each(['tenantId', 'legalEntityId', 'connectionId', 'externalCompanyId'] as const)(
    'rejects a client authorization %s mismatch before transaction I/O',
    async (field) => {
      const sur = registration(3)
      const listTransactions = vi.fn()
      const providerFactory = factory(sur.provider)
      providerFactory.createReadClient.mockResolvedValue({
        provider: sur.provider,
        listTransactions,
        authorization: { ...authorization(sur), [field]: `foreign-${field}` },
      })
      const resolver = createAccountingReadSourceResolver({
        registrations: [sur],
        factories: [providerFactory],
      })

      await expect(resolver.resolve(key(sur))).rejects.toMatchObject({
        code: 'ACCOUNTING_SOURCE_AUTHORIZATION_SCOPE_MISMATCH',
      })
      expect(listTransactions).not.toHaveBeenCalled()
    }
  )

  it('rejects an adapter result without a read operation', async () => {
    const sur = registration(3)
    const providerFactory = factory(sur.provider)
    providerFactory.createReadClient.mockResolvedValue({
      provider: sur.provider,
      authorization: authorization(sur),
    } as never)
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur],
      factories: [providerFactory],
    })

    await expect(
      resolver.resolve({
        tenantId: sur.tenantId,
        legalEntityId: sur.legalEntityId,
        connectionId: sur.connectionId,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_SOURCE_CLIENT_INVALID' })
  })

  it('resolves Norte, Santa Cruz and Sur independently in deterministic order', async () => {
    const sharedProvider = 'cep-accounting-vendor'
    const norte = { ...registration(1), provider: sharedProvider }
    const santaCruz = { ...registration(2), provider: sharedProvider }
    const sur = { ...registration(3), provider: sharedProvider }
    const providerFactory = factory(sharedProvider)
    const resolver = createAccountingReadSourceResolver({
      registrations: [sur, norte, santaCruz],
      factories: [providerFactory],
    })

    const resolved = await resolver.resolveBatch({
      tenantId,
      sources: [key(sur), key(santaCruz), key(norte)],
    })

    expect(resolved.map(({ scope }) => scope.legalEntityId)).toEqual([
      norte.legalEntityId,
      santaCruz.legalEntityId,
      sur.legalEntityId,
    ])
    expect(providerFactory.createReadClient).toHaveBeenCalledTimes(3)
    expect(providerFactory.createReadClient.mock.calls.map(([input]) => input)).toEqual([
      {
        tenantId: norte.tenantId,
        legalEntityId: norte.legalEntityId,
        connectionId: norte.connectionId,
        provider: sharedProvider,
        externalCompanyId: norte.externalCompanyId,
        secretReference: norte.secretReference,
      },
      {
        tenantId: santaCruz.tenantId,
        legalEntityId: santaCruz.legalEntityId,
        connectionId: santaCruz.connectionId,
        provider: sharedProvider,
        externalCompanyId: santaCruz.externalCompanyId,
        secretReference: santaCruz.secretReference,
      },
      {
        tenantId: sur.tenantId,
        legalEntityId: sur.legalEntityId,
        connectionId: sur.connectionId,
        provider: sharedProvider,
        externalCompanyId: sur.externalCompanyId,
        secretReference: sur.secretReference,
      },
    ])
    const serialized = JSON.stringify(resolved)
    for (const source of [norte, santaCruz, sur]) {
      expect(serialized).not.toContain(source.secretReference)
      expect(serialized).not.toContain(source.reviewReference)
    }
  })

  it('validates the complete batch before invoking any provider factory', async () => {
    const norte = registration(1)
    const sur = registration(3)
    const factories = [factory(norte.provider), factory(sur.provider)]
    const resolver = createAccountingReadSourceResolver({
      registrations: [norte, sur],
      factories,
    })

    await expect(
      resolver.resolveBatch({
        tenantId,
        sources: [
          key(norte),
          key(sur),
          {
            tenantId,
            legalEntityId: registration(2).legalEntityId,
            connectionId: registration(2).connectionId,
          },
        ],
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_SOURCE_SCOPE_NOT_REVIEWED' })
    for (const providerFactory of factories) {
      expect(providerFactory.createReadClient).not.toHaveBeenCalled()
    }
  })

  it('rejects a client instance shared by more than one legal entity', async () => {
    const sharedProvider = 'cep-accounting-vendor'
    const norte = { ...registration(1), provider: sharedProvider }
    const sur = { ...registration(3), provider: sharedProvider }
    const sharedClient = {
      provider: sharedProvider,
      listTransactions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      authorization: authorization(norte),
    }
    const providerFactory = factory(sharedProvider)
    providerFactory.createReadClient.mockResolvedValue(sharedClient)
    const resolver = createAccountingReadSourceResolver({
      registrations: [norte, sur],
      factories: [providerFactory],
    })

    await expect(
      resolver.resolveBatch({ tenantId, sources: [key(norte), key(sur)] })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_SOURCE_SHARED_CLIENT' })
    expect(providerFactory.createReadClient).toHaveBeenCalledTimes(2)
    expect(sharedClient.listTransactions).not.toHaveBeenCalled()
  })

  it('rejects a cross-tenant batch before invoking any provider factory', async () => {
    const norte = registration(1)
    const foreign = {
      ...registration(2),
      tenantId: '018f47a2-4a7b-7d09-9a2f-9d4ab1c25e90',
    }
    const factories = [factory(norte.provider), factory(foreign.provider)]
    const resolver = createAccountingReadSourceResolver({
      registrations: [norte, foreign],
      factories,
    })

    await expect(
      resolver.resolveBatch({ tenantId, sources: [key(norte), key(foreign)] })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_SOURCE_BATCH_TENANT_MISMATCH' })
    for (const providerFactory of factories) {
      expect(providerFactory.createReadClient).not.toHaveBeenCalled()
    }
  })

  it.each([
    {
      code: 'ACCOUNTING_SOURCE_BATCH_DUPLICATE_ENTITY',
      duplicate: (source: ReviewedAccountingSourceRegistration) => ({
        ...key(registration(2)),
        legalEntityId: source.legalEntityId,
      }),
    },
    {
      code: 'ACCOUNTING_SOURCE_BATCH_DUPLICATE_CONNECTION',
      duplicate: (source: ReviewedAccountingSourceRegistration) => ({
        ...key(registration(2)),
        connectionId: source.connectionId,
      }),
    },
  ])(
    'rejects an invalid batch binding with $code before adapter I/O',
    async ({ code, duplicate }) => {
      const norte = registration(1)
      const santaCruz = registration(2)
      const factories = [factory(norte.provider), factory(santaCruz.provider)]
      const resolver = createAccountingReadSourceResolver({
        registrations: [norte, santaCruz],
        factories,
      })

      await expect(
        resolver.resolveBatch({ tenantId, sources: [key(norte), duplicate(norte)] })
      ).rejects.toMatchObject({ code })
      for (const providerFactory of factories) {
        expect(providerFactory.createReadClient).not.toHaveBeenCalled()
      }
    }
  )

  it.each([
    { sources: [], maxConnections: undefined },
    { sources: [key(registration(1))], maxConnections: 0 },
    { sources: [key(registration(1)), key(registration(2))], maxConnections: 1 },
    { sources: [key(registration(1))], maxConnections: 101 },
  ])('rejects an empty, oversized or invalid batch bound', async ({ sources, maxConnections }) => {
    const norte = registration(1)
    const providerFactory = factory(norte.provider)
    const resolver = createAccountingReadSourceResolver({
      registrations: [norte],
      factories: [providerFactory],
    })

    await expect(
      resolver.resolveBatch({ tenantId, sources, maxConnections })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_SOURCE_BATCH_INVALID' })
    expect(providerFactory.createReadClient).not.toHaveBeenCalled()
  })
})

describe('accounting secret reference contract', () => {
  it.each([
    'op://cep/accounting/token',
    'vault://cep-sur/api-key',
    'aws-sm://cep/norte',
    'gcp-sm://cep/santa-cruz',
  ])('accepts the supported opaque locator %s', (value) => {
    expect(isAccountingSecretReference(value)).toBe(true)
  })
})
