'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { BloodGroup, OrganType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

const ORGANS: OrganType[] = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea'];
const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

interface Props { onSuccess: () => void; }

export default function DonorForm({ onSuccess }: Props) {
  const { session } = useAuth();
  const [form, setForm] = useState({ organType: 'Kidney', bloodGroup: 'O+', age: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.age || !form.location) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      await api.addDonor({
        ...form,
        age: Number(form.age),
        userId: session?.userId,
        actorName: session?.name || 'Anonymous',
      } as Parameters<typeof api.addDonor>[0]);
      setForm({ organType: 'Kidney', bloodGroup: 'O+', age: '', location: '' });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add donor');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Organ Type</label>
          <select value={form.organType} onChange={e => setForm(f => ({ ...f, organType: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {ORGANS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Blood Group</label>
          <select value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
            {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Age</label>
          <input type="number" min={1} max={100} value={form.age}
            onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            placeholder="e.g. 35"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Location (City/Hospital)</label>
          <input type="text" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Mumbai"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* Age rule reminder */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg px-3 py-2 text-xs text-blue-300">
        Age rules: younger donors can donate to recipients up to 40 years older · older donors can donate to recipients max 10 years younger
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
        {loading ? 'Registering...' : 'Register Donor'}
      </button>
    </form>
  );
}
