import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminClient from '../../components/AdminClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions as any);
  const s: any = session;
  if (!s || s?.user?.role !== 'admin') redirect('/login');
  return <AdminClient />;
}
