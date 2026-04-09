'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Recipient } from '@/lib/types';
import RecipientForm from '@/components/RecipientForm';
import RecipientTable from '@/components/RecipientTable';
import Badge from '@/components/Badge';

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchRecipients = useCallback(async () => {
    try {
      const data = await api.getRecipients();
      setRecipients(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
    const id = setInterval(fetchRecipients, 10000);
    return () => clearInterval(id);
  }, [fetchRecipients]);

  const waiting = recipients.filter(r => r.status === 'waiting').length;
  const allocated = recipients.filter(r => r.status === 'allocated').length;
  const critical = recipients.filter(r => r.status === 'waiting' && r.urgency >= 8).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recipient Waiting List</h1>
          <p className="text-slate-400 text-sm mt-1">Patients awaiting organ transplants</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Recipient'}
        </button>
      </div>

      <div className="flex gap-3">
        <Badge label={`${waiting} Waiting`} variant="yellow" />
        <Badge label={`${allocated} Allocated`} variant="blue" />
        <Badge label={`${critical} Critical`} variant="red" />
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Add Recipient to Waiting List</h2>
          <RecipientForm onSuccess={() => { setShowForm(false); fetchRecipients(); }} />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Waiting List ({recipients.length})</h2>
        {loading ? (
          <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <RecipientTable recipients={recipients} />
        )}
      </div>
    </div>
  );
}
