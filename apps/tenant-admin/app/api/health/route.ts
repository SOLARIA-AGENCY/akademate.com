/**
 * Health Check Endpoint
 *
 * GET /api/health - Simple health check for load balancers and monitoring
 *
 * Returns 200 OK with status information.
 * Exempt from HTTPS redirect to allow load balancer health checks.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
