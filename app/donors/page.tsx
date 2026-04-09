'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Donor } from '@/lib/types';
import DonorForm from '@/components/DonorForm';
import DonorTable from '@/components/DonorTable';
import Badge from '@/components/Badge';

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchDonors = useCallback(async () => {
    try {
      const data = await api.getDonors();
      setDonors(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonors();
    const id = setInterval(fetchDonors, 10000);
    return () => clearInterval(id);
  }, [fetchDonors]);

  const available = donors.filter(d => d.status === 'available').length;
  const allocated = donors.filter(d => d.status === 'allocated').length;
  const expired = donors.filter(d => d.status === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Donor Registry</h1>
          <p className="text-slate-400 text-sm mt-1">Manage organ donors and trigger allocations</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Register Donor'}
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3">
        <Badge label={`${available} Available`} variant="green" />
        <Badge label={`${allocated} Allocated`} variant="blue" />
        <Badge label={`${expired} Expired`} variant="red" />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Register New Donor</h2>
          <DonorForm onSuccess={() => { setShowForm(false); fetchDonors(); }} />
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">All Donors ({donors.length})</h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <DonorTable donors={donors} onAllocate={fetchDonors} />
        )}
      </div>
    </div>
  );
}
