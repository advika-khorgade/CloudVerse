'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';

const ROLE_INFO = {
  donor: {
    icon: '🫀',
    title: 'Donor',
    desc: 'Register as an organ donor and save lives',
    color: 'border-blue-600 bg-blue-900/20',
  },
  recipient: {
    icon: '🏥',
    title: 'Recipient',
    desc: 'Join the waiting list for an organ transplant',
    color: 'border-emerald-600 bg-emerald-900/20',
  },
};

export default function RegisterPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<'donor' | 'recipient'>('donor');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const session = await api.register({ name: form.name, email: form.email, password: form.password, role });
      setSession(session);
      router.push(role === 'donor' ? '/my-donor' : '/my-recipient');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🫀</span>
          <h1 className="text-2xl font-bold text-white mt-3">Create account</h1>
          <p className="text-slate-400 text-sm mt-1">Join OrganMatch today</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(Object.entries(ROLE_INFO) as [UserRole, typeof ROLE_INFO[keyof typeof ROLE_INFO]][]).map(([r, info]) => (
              <button key={r} type="button" onClick={() => setRole(r as 'donor' | 'recipient')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  role === r ? info.color : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                }`}>
                <span className="text-2xl">{info.icon}</span>
                <p className="text-white text-sm font-medium mt-1">{info.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{info.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe" required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com" required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 chars" required
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Confirm</label>
                <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat" required
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Creating account...' : `Register as ${role === 'donor' ? 'Donor' : 'Recipient'}`}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
