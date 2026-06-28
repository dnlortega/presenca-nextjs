// github.com/dnlortega
// linkedin.com/in/daniel-op
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import type { Session } from 'next-auth';

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'admin';
}

export function isEducator(session: Session | null): boolean {
  return session?.user?.role === 'educador' || session?.user?.role === 'admin';
}
