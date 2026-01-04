import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminClient from '../../components/AdminClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions as any);
  const s: any = session;
  if (!s || s?.user?.role !== 'admin') redirect('/login');
  return <AdminClient />;
}
