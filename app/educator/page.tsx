// github.com/dnlortega
// linkedin.com/in/daniel-op
import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import EducatorClient from '../../components/EducatorClient';

export default async function EducatorPage() {
  const session = await getSession();
  if (!session || session.user?.role !== 'educador') redirect('/login');
  return <EducatorClient />;
}
