'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await api.login(form.email, form.password);
      setSession(session);
      // Route based on role
      if (session.role === 'admin') router.push('/admin');
      else if (session.role === 'donor') router.push('/my-donor');
      else router.push('/my-recipient');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🫀</span>
          <h1 className="text-2xl font-bold text-white mt-3">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to OrganMatch</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
          {/* Quick demo logins */}
          <div className="mb-6 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 mb-2 font-medium">Demo accounts</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Admin', email: 'admin@organmatch.com', pw: 'admin123' },
              ].map(d => (
                <button key={d.label} type="button"
                  onClick={() => setForm({ email: d.email, password: d.pw })}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors">
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com" required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
