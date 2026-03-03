'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest } from '../../lib/api';
import { setToken } from '../../lib/auth-store';

type LoginResponse = {
  access_token: string;
  token_type: string;
};

const AUTH_SESSION_STORAGE_KEY = 'flowbiz_admin_auth_session_v1';
const LEGACY_TOKEN_STORAGE_KEY = 'flowbiz_admin_token';

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
      const response = await apiRequest<LoginResponse>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const token = String(response.access_token || '').trim();
      setToken(token);
      if (typeof window !== 'undefined' && token) {
        window.sessionStorage.setItem(
          AUTH_SESSION_STORAGE_KEY,
          JSON.stringify({ token, email: email.trim() }),
        );
        window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      }
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
        <button className="w-full bg-slate-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
