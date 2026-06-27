export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '../../lib/session';
import AdminClient from '../../components/AdminClient';

export default async function AdminPage() {
  const session = await getSession();
  if (!isAdmin(session)) redirect('/login');
  return <AdminClient />;
}
