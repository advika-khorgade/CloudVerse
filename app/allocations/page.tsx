'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Allocation } from '@/lib/types';
import AllocationTable from '@/components/AllocationTable';

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllocations = useCallback(async () => {
    try {
      const data = await api.getAllocations();
      setAllocations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
    const id = setInterval(fetchAllocations, 10000);
    return () => clearInterval(id);
  }, [fetchAllocations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Allocation History</h1>
        <p className="text-slate-400 text-sm mt-1">
          Full transparency panel — every allocation with its reasoning
        </p>
      </div>

      {/* Matching rules info */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-3">Matching Rules (Rule-Based Engine)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { icon: '🩸', title: 'Blood Compatibility', desc: 'O→all, A→A/AB, B→B/AB, AB→AB' },
            { icon: '🫀', title: 'Organ Type', desc: 'Exact match required' },
            { icon: '👤', title: 'Age Difference', desc: 'Max ±15 years' },
            { icon: '📍', title: 'Location', desc: 'Same city prioritized' },
          ].map(r => (
            <div key={r.title} className="bg-slate-800/60 rounded-lg p-3">
              <span className="text-xl">{r.icon}</span>
              <p className="text-white text-xs font-medium mt-1">{r.title}</p>
              <p className="text-slate-400 text-xs mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">
          All Allocations ({allocations.length})
        </h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <AllocationTable allocations={allocations} />
        )}
      </div>
    </div>
  );
}
