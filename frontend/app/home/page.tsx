'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

type User = { id: number; email: string };

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) {
        localStorage.removeItem('auth_token');
        router.replace('/login');
        return;
      }
      return res.json();
    }).then((data) => {
      if (data) setUser(data);
    });
  }, [router]);

  function handleSignOut() {
    localStorage.removeItem('auth_token');
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo}>Cloud App</span>
        <button onClick={handleSignOut} className={styles.logoutButton}>
          Sign out
        </button>
      </header>

      <h1 className={styles.welcome}>Welcome back!</h1>
      <p className={styles.email}>{user.email}</p>

      <div className={styles.card}>
        <h2>Your account</h2>
        <p>User ID: {user.id}</p>
      </div>

      <div className={styles.card}>
        <h2>Games</h2>
        <Link href="/game" className={styles.gameButton}>
          Play Tic-Tac-Toe
        </Link>
      </div>
    </div>
  );
}
