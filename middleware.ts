// github.com/dnlortega
// linkedin.com/in/daniel-op
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limit (resets on cold start — acceptable for serverless)
// TTL-based cleanup keeps memory bounded
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
  lastCleanup = now;
}

function apiRateLimit(key: string, max: number, windowMs: number): boolean {
  cleanup();
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function rateLimitHeaders(limited: boolean): Headers {
  const h = new Headers();
  if (limited) {
    h.set('Retry-After', '60');
    h.set('X-RateLimit-Limit', 'exceeded');
  }
  return h;
}

export default withAuth(
  function middleware(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { pathname, method } = { pathname: req.nextUrl.pathname, method: req.method };

    if (pathname.startsWith('/api/')) {
      // Auth endpoints: 20 req / 15 min (brute-force protection for login)
      if (pathname.startsWith('/api/auth/') && !apiRateLimit(`auth:${ip}`, 20, 15 * 60_000)) {
        return new NextResponse('Too Many Requests', { status: 429, headers: rateLimitHeaders(true) });
      }

      // Attendance POST: 60 req / min (bulk chamada)
      if (pathname === '/api/attendance' && method === 'POST' && !apiRateLimit(`att:${ip}`, 60, 60_000)) {
        return new NextResponse('Too Many Requests', { status: 429, headers: rateLimitHeaders(true) });
      }

      // Admin API: 200 req / min
      if (pathname.startsWith('/api/admin/') && !apiRateLimit(`admin:${ip}`, 200, 60_000)) {
        return new NextResponse('Too Many Requests', { status: 429, headers: rateLimitHeaders(true) });
      }

      // Educator API: 120 req / min
      if (
        (pathname.startsWith('/api/employees') || pathname.startsWith('/api/sectors') || pathname.startsWith('/api/my-companies')) &&
        !apiRateLimit(`edu:${ip}`, 120, 60_000)
      ) {
        return new NextResponse('Too Many Requests', { status: 429, headers: rateLimitHeaders(true) });
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
    '/educator/:path*',
    '/api/admin/:path*',
    '/api/attendance/:path*',
    '/api/attendance',
    '/api/employees/:path*',
    '/api/employees',
    '/api/sectors/:path*',
    '/api/sectors',
    '/api/my-companies',
    '/api/escolher-papel',
  ],
};
