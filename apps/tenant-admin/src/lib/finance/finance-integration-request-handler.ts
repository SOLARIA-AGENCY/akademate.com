import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { FinanceIntegrationRequestError, type FinanceIntegrationRequestRecord } from './finance-integration-request-command.ts'

type Dependencies = {
  runtime: () => ReturnType<typeof import('./finance-runtime.ts').currentFinanceRuntime>
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  list: (input: { identity: NextLearningIdentity }) => Promise<{ items: FinanceIntegrationRequestRecord[] }>
  create: (input: { identity: NextLearningIdentity; payload: unknown }) => Promise<FinanceIntegrationRequestRecord>
  detail: (input: { identity: NextLearningIdentity; requestId: string }) => Promise<FinanceIntegrationRequestRecord>
  cancel: (input: { identity: NextLearningIdentity; requestId: string }) => Promise<FinanceIntegrationRequestRecord>
}

function json(body: unknown, status: number) { return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } }) }
function errorResponse(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) return json({ error: error.code === 'principal_inactive_or_mismatched' ? 'unauthorized' : 'finance_service_unavailable' }, error.code === 'principal_inactive_or_mismatched' ? 401 : 503)
  if (error instanceof FinanceIntegrationRequestError) {
    if (error.code === 'finance_runtime_disabled') return json({ error: 'not_found' }, 404)
    if (error.code === 'finance_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'finance_request_not_found') return json({ error: 'not_found' }, 404)
    if (error.code === 'finance_invalid_request') return json({ error: 'invalid_request' }, 422)
    if (error.code === 'finance_request_cannot_cancel') return json({ error: 'conflict' }, 409)
    return json({ error: 'finance_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Finance] Integration request error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createFinanceIntegrationRequestHandlers(dependencies: Dependencies) {
  async function GET(request: Request) { if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404); try { const identity = await dependencies.authenticate(request); if (!identity) return json({ error: 'unauthorized' }, 401); return json(await dependencies.list({ identity }), 200) } catch (error) { return errorResponse(error) } }
  async function POST(request: Request) { if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404); try { const identity = await dependencies.authenticate(request); if (!identity) return json({ error: 'unauthorized' }, 401); return json(await dependencies.create({ identity, payload: await request.json() }), 201) } catch (error) { return errorResponse(error) } }
  async function DETAIL(request: Request, context: { params: Promise<{ id: string }> }) { if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404); try { const identity = await dependencies.authenticate(request); if (!identity) return json({ error: 'unauthorized' }, 401); const { id } = await context.params; return json(await dependencies.detail({ identity, requestId: id }), 200) } catch (error) { return errorResponse(error) } }
  async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { if (dependencies.runtime().mode === 'disabled') return json({ error: 'not_found' }, 404); try { const identity = await dependencies.authenticate(request); if (!identity) return json({ error: 'unauthorized' }, 401); const { id } = await context.params; return json(await dependencies.cancel({ identity, requestId: id }), 200) } catch (error) { return errorResponse(error) } }
  return { GET, POST, DETAIL, PATCH }
}
