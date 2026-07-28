/**
 * Health Check Endpoint
 *
 * GET /api/health - Simple health check for load balancers and monitoring
 *
 * Returns 200 OK with status information.
 * Exempt from HTTPS redirect to allow load balancer health checks.
 */

import { NextResponse } from 'next/server';
import { getHealthHeaders } from './health-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '1.0.0',
      revision: process.env.APP_REVISION ?? 'unknown',
    },
    {
      status: 200,
      headers: getHealthHeaders(),
    }
  );
}
