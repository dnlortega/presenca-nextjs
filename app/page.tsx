import { redirect } from 'next/navigation';
import { getSession } from '../lib/session';
import PendingView from '../components/PendingView';
import SessionProviderWrapper from '../components/SessionProviderWrapper';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const role = session.user?.role;

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
