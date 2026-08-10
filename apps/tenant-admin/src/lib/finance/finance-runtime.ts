export type FinanceRuntimeMode = 'disabled' | 'scaffold' | 'connected'

export type FinanceRuntime = {
  mode: FinanceRuntimeMode
  externalIo: boolean
  realData: boolean
  webhooks: boolean
  writeback: boolean
}

export type FinanceRuntimeEnvironment = Record<string, string | undefined>

const disabled: FinanceRuntime = {
  mode: 'disabled',
  externalIo: false,
  realData: false,
  webhooks: false,
  writeback: false,
}

export function resolveFinanceRuntime(environment: FinanceRuntimeEnvironment): FinanceRuntime {
  if (environment.AKADEMATE_RUNTIME !== 'next') return disabled

  const mode = environment.AKADEMATE_NEXT_FINANCE_MODE
  if (mode === 'disabled' || !mode) return disabled

  const externalIo = environment.AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED === 'true'
  const realData = environment.AKADEMATE_NEXT_FINANCE_REAL_DATA_ENABLED === 'true'
  const webhooks = environment.AKADEMATE_NEXT_FINANCE_WEBHOOKS_ENABLED === 'true'
  const writeback = environment.AKADEMATE_NEXT_FINANCE_WRITEBACK_ENABLED === 'true'

  if (mode === 'scaffold') {
    return externalIo || realData || webhooks || writeback
      ? disabled
      : { mode: 'scaffold', externalIo: false, realData: false, webhooks: false, writeback: false }
  }

  if (mode !== 'connected' || !externalIo || !realData) return disabled
  return { mode: 'connected', externalIo: true, realData: true, webhooks, writeback }
}

export function currentFinanceRuntime(): FinanceRuntime {
  return resolveFinanceRuntime(process.env)
}

export const disabledFinanceRuntime = disabled
