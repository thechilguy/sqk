import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

async function getUser(token: string) {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: number; email: string }>;
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await getUser(token);
  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo}>Cloud App</span>
        <Link href="/api/auth/logout" className={styles.logoutButton}>
          Sign out
        </Link>
      </header>

      <h1 className={styles.welcome}>Welcome back!</h1>
      <p className={styles.email}>{user.email}</p>

      <div className={styles.card}>
        <h2>Your account</h2>
        <p>User ID: {user.id}</p>
      </div>
    </div>
  );
}
