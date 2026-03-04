'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  ADMIN_AUTH_LOGIN_PATH,
  loginAdmin,
  persistAuthSession,
} from '@/app/_lib/admin-auth';
import { setToken } from '../../lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginAdmin(email, password);
      if (!result.ok) {
        throw new Error(`auth_failed:${result.status}`);
      }

      const token = result.accessToken;
      persistAuthSession(token, email.trim());
      setToken(token);
      router.push('/admin/dashboard');
    } catch {
      setError('Login failed. Check email/password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white w-full max-w-sm rounded-lg p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input id="login-email" className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input id="login-password" className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
        </div>
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <p className="text-xs text-slate-500">
          Auth endpoint: <code>{ADMIN_AUTH_LOGIN_PATH}</code>
        </p>
        <button className="w-full bg-slate-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
