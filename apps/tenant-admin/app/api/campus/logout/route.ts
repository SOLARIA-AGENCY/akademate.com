/**
 * Campus Logout API
 *
 * Logs out the student (client-side token removal).
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // JWT is stateless, so logout is handled client-side
  // This endpoint exists for potential future token blacklisting
  // or session invalidation in Redis

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
