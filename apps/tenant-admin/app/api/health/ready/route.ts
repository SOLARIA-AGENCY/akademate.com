import { getReadinessResponse } from '../health-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return getReadinessResponse();
}
