// github.com/dnlortega
// linkedin.com/in/daniel-op
import { redirect } from 'next/navigation';
import { getSession } from '../lib/session';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const role = session.user?.role;

  if (role === 'pendente' || !role) {
    redirect('/escolher-papel');
  }

  if (role === 'admin') {
    redirect('/admin');
  } else if (role === 'educador') {
    redirect('/educator');
  } else {
    redirect('/login');
  }
}
