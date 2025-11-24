import { redirect } from 'next/navigation';

export default function Page() {
  // redirect root to the login page to remove the previous landing
  redirect('/login');
}
