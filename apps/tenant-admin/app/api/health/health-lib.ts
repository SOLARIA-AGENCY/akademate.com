import postgres from 'postgres';
import { NextResponse } from 'next/server';

const sqlClients = new Map<string, ReturnType<typeof postgres>>();

function getDatabaseClient(): ReturnType<typeof postgres> | null {
  const databaseUrl = (process.env.DATABASE_URL ?? process.env.DATABASE_URI ?? '').trim();
  if (!databaseUrl) return null;

  const existing = sqlClients.get(databaseUrl);
  if (existing) return existing;

  const client = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 2,
    idle_timeout: 5,
    prepare: false,
  });
  sqlClients.set(databaseUrl, client);
  return client;
}

export function getHealthHeaders(): Record<string, string> {
  return { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
}

function revision(): string {
  return process.env.APP_REVISION ?? 'unknown';
}

/** Liveness check: no dependency must be consulted here. */
export function getLivenessResponse(): NextResponse {
  return NextResponse.json(
    { status: 'ok', check: 'live', revision: revision(), timestamp: new Date().toISOString() },
    { status: 200, headers: getHealthHeaders() },
  );
}

/** Readiness check: the process is ready only when PostgreSQL answers. */
export async function getReadinessResponse(): Promise<NextResponse> {
  const sql = getDatabaseClient();
  if (!sql) {
    return NextResponse.json(
      { status: 'not_ready', check: 'ready', revision: revision(), checks: { database: 'not_configured' } },
      { status: 503, headers: getHealthHeaders() },
    );
  }

  try {
    await sql`SELECT 1`;
    return NextResponse.json(
      { status: 'ready', check: 'ready', revision: revision(), checks: { database: 'ok' } },
      { status: 200, headers: getHealthHeaders() },
    );
  } catch {
    return NextResponse.json(
      { status: 'not_ready', check: 'ready', revision: revision(), checks: { database: 'unavailable' } },
      { status: 503, headers: getHealthHeaders() },
    );
  }
}
