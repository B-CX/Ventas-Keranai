import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const role = (session.user as any)?.role;
  if (role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/venta');
  }
}
