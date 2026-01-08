import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { redirect } from 'next/navigation';
import EducatorClient from '../../components/EducatorClient';

export default async function EducatorPage() {
  const session = await getServerSession(authOptions as any);
  const s: any = session;
  if (!s || s?.user?.role !== 'educador') redirect('/login');
  return <EducatorClient />;
}
