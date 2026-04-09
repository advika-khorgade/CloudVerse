'use client';
import { Donor } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import Badge from './Badge';
import CountdownTimer from './CountdownTimer';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Props { donors: Donor[]; onAllocate: () => void; }

const organIcons: Record<string, string> = {
  Heart: '❤️', Liver: '🫁', Kidney: '🫘', Lung: '🫁', Pancreas: '🧬', Cornea: '👁️',
};

export default function DonorTable({ donors, onAllocate }: Props) {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAllocate = async (donorId: string) => {
    setError('');
    setLoading(donorId);
    try {
      await api.allocateOrgan(donorId);
      onAllocate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Allocation failed');
    } finally { setLoading(null); }
  };

  if (donors.length === 0) return (
    <div className="text-center py-12 text-slate-500">No donors registered yet.</div>
  );

  return (
    <div>
      {error && <div className="mb-3 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4">Organ</th>
              <th className="text-left py-3 px-4">Blood</th>
              <th className="text-left py-3 px-4">Age</th>
              <th className="text-left py-3 px-4">Location</th>
              <th className="text-left py-3 px-4">Expires In</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {donors.map(d => (
              <tr key={d.donorId} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4 font-medium text-white">
                  {organIcons[d.organType] || '🫀'} {d.organType}
                </td>
                <td className="py-3 px-4">
                  <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-mono">{d.bloodGroup}</span>
                </td>
                <td className="py-3 px-4 text-slate-300">{d.age}</td>
                <td className="py-3 px-4 text-slate-300">{d.location}</td>
                <td className="py-3 px-4">
                  <CountdownTimer expiryTime={d.expiryTime} status={d.status} />
                </td>
                <td className="py-3 px-4">
                  <Badge
                    label={d.status}
                    variant={d.status === 'available' ? 'green' : d.status === 'allocated' ? 'blue' : 'red'}
                  />
                </td>
                <td className="py-3 px-4">
                  {d.status === 'available' && isAdmin && (
                    <button onClick={() => handleAllocate(d.donorId)} disabled={loading === d.donorId}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                      {loading === d.donorId ? '...' : 'Allocate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
