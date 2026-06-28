// github.com/dnlortega
// linkedin.com/in/daniel-op
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limit store (resets on cold start — good enough for edge)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function apiRateLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export default withAuth(
  function middleware(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const path = req.nextUrl.pathname;

    // Rate limit sensitive API endpoints
    if (path.startsWith('/api/')) {
      const isAuthEndpoint = path.startsWith('/api/auth/');
      const isAttendancePost = path === '/api/attendance' && req.method === 'POST';

      // Auth endpoints: 20 req / 15 min
      if (isAuthEndpoint && !apiRateLimit(`auth:${ip}`, 20, 15 * 60 * 1000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }

      // Attendance POST: 60 req / min (bulk registrations)
      if (isAttendancePost && !apiRateLimit(`att:${ip}`, 60, 60 * 1000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }

      // Admin API: 200 req / min
      if (path.startsWith('/api/admin/') && !apiRateLimit(`admin:${ip}`, 200, 60 * 1000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/attendance/:path*',
    '/api/attendance',
  ],
};
