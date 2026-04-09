'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Donor, Recipient, Allocation } from '@/lib/types';
import StatCard from '@/components/StatCard';
import CountdownTimer from '@/components/CountdownTimer';
import Badge from '@/components/Badge';

// Poll every 10 seconds for real-time updates
const POLL_INTERVAL = 10000;

export default function Dashboard() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [d, r, a] = await Promise.all([api.getDonors(), api.getRecipients(), api.getAllocations()]);
      setDonors(d);
      setRecipients(r);
      setAllocations(a);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Polling error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAll]);

  const available = donors.filter(d => d.status === 'available');
  const expired = donors.filter(d => d.status === 'expired');
  const waiting = recipients.filter(r => r.status === 'waiting');
  const critical = recipients.filter(r => r.status === 'waiting' && r.urgency >= 8);

  // Organs expiring within 2 hours
  const expiringSoon = available.filter(d => {
    const ms = new Date(d.expiryTime).getTime() - Date.now();
    return ms > 0 && ms < 2 * 3600 * 1000;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 animate-pulse text-lg">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time organ donation matching & allocation
            {lastUpdated && <span className="ml-2 text-slate-500">· Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
          Live · Polling every 10s
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available Donors" value={available.length} icon="🫀" color="green" sub="Ready for allocation" />
        <StatCard label="Waiting Recipients" value={waiting.length} icon="⏳" color="blue" sub="On waiting list" />
        <StatCard label="Successful Allocations" value={allocations.length} icon="✅" color="green" sub="Total matched" />
        <StatCard label="Critical Patients" value={critical.length} icon="🚨" color="red" sub="Urgency ≥ 8/10" />
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <span className="text-red-300 font-semibold">Organs Expiring Soon</span>
            <Badge label={`${expiringSoon.length} organ${expiringSoon.length > 1 ? 's' : ''}`} variant="red" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expiringSoon.map(d => (
              <div key={d.donorId} className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{d.organType} · {d.bloodGroup}</p>
                  <p className="text-slate-400 text-xs">{d.location} · Age {d.age}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Expires in</p>
                  <CountdownTimer expiryTime={d.expiryTime} status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Donors */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            🫀 Available Donors
            <Badge label={String(available.length)} variant="green" />
          </h2>
          {available.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No available donors</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {available.map(d => (
                <div key={d.donorId} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white text-sm font-medium">{d.organType}</span>
                    <span className="text-slate-400 text-xs ml-2">{d.bloodGroup} · Age {d.age} · {d.location}</span>
                  </div>
                  <CountdownTimer expiryTime={d.expiryTime} status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Recipients */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            🚨 Critical Recipients
            <Badge label={String(critical.length)} variant="red" />
          </h2>
          {critical.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No critical patients</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {critical.sort((a, b) => b.urgency - a.urgency).map(r => (
                <div key={r.recipientId} className="flex items-center justify-between bg-red-900/20 border border-red-900 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white text-sm font-medium">{r.requiredOrgan}</span>
                    <span className="text-slate-400 text-xs ml-2">{r.bloodGroup} · Age {r.age} · {r.location}</span>
                  </div>
                  <Badge label={`${r.urgency}/10`} variant="red" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Allocations */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          ✅ Recent Allocations
          <Badge label={String(allocations.length)} variant="blue" />
        </h2>
        {allocations.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No allocations yet. Add donors and recipients to get started.</p>
        ) : (
          <div className="space-y-2">
            {[...allocations].reverse().slice(0, 5).map(a => (
              <div key={a.allocationId} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <span className="text-white text-sm font-medium">{a.organType}</span>
                    <span className="text-slate-400 text-xs ml-2">Urgency {a.reason.urgency}/10</span>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">{expired.length}</p>
          <p className="text-slate-400 text-xs mt-1">Expired Organs</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">{expiringSoon.length}</p>
          <p className="text-slate-400 text-xs mt-1">Expiring &lt; 2h</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">
            {donors.length > 0 ? Math.round((allocations.length / donors.length) * 100) : 0}%
          </p>
          <p className="text-slate-400 text-xs mt-1">Allocation Rate</p>
        </div>
      </div>
    </div>
  );
}
