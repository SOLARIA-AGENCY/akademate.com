import { getLivenessResponse } from '../health-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return getLivenessResponse();
}
