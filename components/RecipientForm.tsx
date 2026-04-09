'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { BloodGroup, OrganType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

const ORGANS: OrganType[] = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea'];
const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

interface Props { onSuccess: () => void; }

export default function RecipientForm({ onSuccess }: Props) {
  const { session } = useAuth();
  const [form, setForm] = useState({ requiredOrgan: 'Kidney', bloodGroup: 'O+', age: '', location: '', urgency: '5' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.age || !form.location) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      await api.addRecipient({
        ...form,
        age: Number(form.age),
        urgency: Number(form.urgency),
        userId: session?.userId,
        actorName: session?.name || 'Anonymous',
      } as Parameters<typeof api.addRecipient>[0]);
      setForm({ requiredOrgan: 'Kidney', bloodGroup: 'O+', age: '', location: '', urgency: '5' });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add recipient');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Required Organ</label>
          <select value={form.requiredOrgan} onChange={e => setForm(f => ({ ...f, requiredOrgan: e.target.value }))}
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
            placeholder="e.g. 40"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Location</label>
          <input type="text" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Delhi"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Urgency: <span className={`font-semibold ${Number(form.urgency) >= 8 ? 'text-red-400' : Number(form.urgency) >= 5 ? 'text-yellow-400' : 'text-green-400'}`}>{form.urgency}/10</span>
        </label>
        <input type="range" min={1} max={10} value={form.urgency}
          onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
          className="w-full accent-red-500" />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1 – Low</span><span>5 – Medium</span><span>10 – Critical</span>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
        {loading ? 'Adding...' : 'Add to Waiting List'}
      </button>
    </form>
  );
}
