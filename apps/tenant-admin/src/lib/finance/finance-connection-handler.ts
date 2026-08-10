import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { FinanceConnectionError, type FinanceConnectionRecord } from './finance-connection-command.ts'

export type FinanceConnectionHandlerDependencies = {
  runtime: () => ReturnType<typeof import('./finance-runtime.ts').currentFinanceRuntime>
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  list: (input: { identity: NextLearningIdentity }) => Promise<{ items: FinanceConnectionRecord[] }>
  create: (input: { identity: NextLearningIdentity; payload: unknown }) => Promise<FinanceConnectionRecord>
  update: (input: { identity: NextLearningIdentity; connectionId: string; payload: unknown }) => Promise<FinanceConnectionRecord>
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function responseForError(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    return json({ error: 'finance_service_unavailable' }, 503)
  }
  if (error instanceof FinanceConnectionError) {
    if (error.code === 'finance_runtime_disabled') return json({ error: 'not_found' }, 404)
    if (error.code === 'finance_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'finance_connection_not_found') return json({ error: 'not_found' }, 404)
    if (error.code === 'finance_invalid_request') return json({ error: 'invalid_request' }, 422)
    if (error.code === 'finance_provider_not_available' || error.code === 'finance_mode_not_supported') return json({ error: 'conflict' }, 409)
    return json({ error: 'finance_service_unavailable' }, 503)
  }
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null
  if (code === '23505') return json({ error: 'conflict' }, 409)
  if (code === '42501') return json({ error: 'forbidden' }, 403)
  console.error('[Akademate Next Finance] Unhandled connection error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createFinanceConnectionHandlers(dependencies: FinanceConnectionHandlerDependencies) {
  async function GET(request: Request): Promise<Response> {
    if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404)
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.list({ identity }), 200)
    } catch (error) {
      return responseForError(error)
    }
  }

  async function POST(request: Request): Promise<Response> {
    if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404)
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.create({ identity, payload: await request.json() }), 201)
    } catch (error) {
      return responseForError(error)
    }
  }

  async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
    if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404)
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const { id } = await context.params
      return json(await dependencies.update({ identity, connectionId: id, payload: await request.json() }), 200)
    } catch (error) {
      return responseForError(error)
    }
  }

  return { GET, POST, PATCH }
}
