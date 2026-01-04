import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PendingView from '../components/PendingView';
import SessionProviderWrapper from '../components/SessionProviderWrapper';

export default async function Page() {
  const session = await getServerSession(authOptions as any);

  if (!session) {
    redirect('/login');
  }

  const role = (session.user as any)?.role;

  if (role === 'pendente' || !role) {
    return (
      <SessionProviderWrapper>
        <PendingView />
      </SessionProviderWrapper>
    );
  }

  if (role === 'admin') {
    redirect('/admin');
  } else if (role === 'educador') {
    redirect('/educator');
  } else {
    redirect('/login');
  }
}
