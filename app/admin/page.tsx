'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Donor, Recipient, Allocation, ActivityLog } from '@/lib/types';
import Badge from '@/components/Badge';
import CountdownTimer from '@/components/CountdownTimer';
import StatCard from '@/components/StatCard';

type Tab = 'overview' | 'donors' | 'recipients' | 'allocations' | 'logs';

export default function AdminPage() {
  const { session, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<string | null>(null);
  const [allocError, setAllocError] = useState('');

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/'); return; }
  }, [session, isAdmin, router]);

  const fetchAll = useCallback(async () => {
    if (!session || !isAdmin) return;
    const [d, r, a, l, s] = await Promise.all([
      api.getDonors(), api.getRecipients(), api.getAllocations(),
      api.getActivityLogs(), api.getStats(),
    ]);
    setDonors(d); setRecipients(r); setAllocations(a);
    setLogs(l); setStats(s as Record<string, number>);
    setLoading(false);
  }, [session, isAdmin]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 8000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleAllocate = async (donorId: string) => {
    setAllocError('');
    setAllocating(donorId);
    try {
      await api.allocateOrgan(donorId);
      fetchAll();
    } catch (e: unknown) {
      setAllocError(e instanceof Error ? e.message : 'Allocation failed');
    } finally { setAllocating(null); }
  };

  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Delete this donor?')) return;
    await api.deleteDonor(donorId);
    fetchAll();
  };

  const handleDeleteRecipient = async (recipientId: string) => {
    if (!confirm('Remove this recipient?')) return;
    await api.deleteRecipient(recipientId);
    fetchAll();
  };

  if (!session || !isAdmin) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'donors', label: '🫀 Donors' },
    { id: 'recipients', label: '🏥 Recipients' },
    { id: 'allocations', label: '✅ Allocations' },
    { id: 'logs', label: '📋 Activity Log' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Full system oversight · Logged in as {session.name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse inline-block" />
          Admin · Live
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse">Loading...</div>
      ) : (
        <>
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Available Donors" value={stats.availableDonors ?? 0} icon="🫀" color="green" />
                <StatCard label="Waiting Recipients" value={stats.waitingRecipients ?? 0} icon="⏳" color="blue" />
                <StatCard label="Total Allocations" value={stats.totalAllocations ?? 0} icon="✅" color="green" />
                <StatCard label="Critical Patients" value={stats.criticalRecipients ?? 0} icon="🚨" color="red" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.expiredDonors ?? 0}</p>
                  <p className="text-slate-400 text-xs mt-1">Expired Organs</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.allocationRate ?? 0}%</p>
                  <p className="text-slate-400 text-xs mt-1">Allocation Rate</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-slate-300">{stats.totalDonors ?? 0}</p>
                  <p className="text-slate-400 text-xs mt-1">Total Donors</p>
                </div>
              </div>

              {/* Blood group compatibility reference */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <h2 className="text-white font-semibold mb-4">Blood Group Compatibility Matrix (Rh-Aware)</h2>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-2 px-3">Donor</th>
                        {['O-','O+','A-','A+','B-','B+','AB-','AB+'].map(g => (
                          <th key={g} className="py-2 px-2 text-center">{g}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ['O-',  [1,1,1,1,1,1,1,1]],
                        ['O+',  [0,1,0,1,0,1,0,1]],
                        ['A-',  [0,0,1,1,0,0,1,1]],
                        ['A+',  [0,0,0,1,0,0,0,1]],
                        ['B-',  [0,0,0,0,1,1,1,1]],
                        ['B+',  [0,0,0,0,0,1,0,1]],
                        ['AB-', [0,0,0,0,0,0,1,1]],
                        ['AB+', [0,0,0,0,0,0,0,1]],
                      ] as [string, number[]][]).map(([donor, compat]) => (
                        <tr key={donor} className="border-t border-slate-800">
                          <td className="py-2 px-3 font-mono font-semibold text-white">{donor}</td>
                          {compat.map((c, i) => (
                            <td key={i} className="py-2 px-2 text-center">
                              {c ? <span className="text-green-400">✓</span> : <span className="text-slate-700">✗</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Donors ── */}
          {tab === 'donors' && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">All Donors ({donors.length})</h2>
              {allocError && <div className="mb-3 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">{allocError}</div>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                      <th className="text-left py-3 px-3">Organ</th>
                      <th className="text-left py-3 px-3">Blood</th>
                      <th className="text-left py-3 px-3">Age</th>
                      <th className="text-left py-3 px-3">Location</th>
                      <th className="text-left py-3 px-3">Expires</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {donors.map(d => (
                      <tr key={d.donorId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 text-white font-medium">{d.organType}</td>
                        <td className="py-3 px-3"><span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded">{d.bloodGroup}</span></td>
                        <td className="py-3 px-3 text-slate-300">{d.age}</td>
                        <td className="py-3 px-3 text-slate-300">{d.location}</td>
                        <td className="py-3 px-3"><CountdownTimer expiryTime={d.expiryTime} status={d.status} /></td>
                        <td className="py-3 px-3">
                          <Badge label={d.status} variant={d.status === 'available' ? 'green' : d.status === 'allocated' ? 'blue' : 'red'} />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-2">
                            {d.status === 'available' && (
                              <button onClick={() => handleAllocate(d.donorId)} disabled={allocating === d.donorId}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded transition-colors">
                                {allocating === d.donorId ? '...' : 'Allocate'}
                              </button>
                            )}
                            <button onClick={() => handleDeleteDonor(d.donorId)}
                              className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs px-2 py-1 rounded transition-colors">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Recipients ── */}
          {tab === 'recipients' && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">All Recipients ({recipients.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                      <th className="text-left py-3 px-3">Organ</th>
                      <th className="text-left py-3 px-3">Blood</th>
                      <th className="text-left py-3 px-3">Age</th>
                      <th className="text-left py-3 px-3">Location</th>
                      <th className="text-left py-3 px-3">Urgency</th>
                      <th className="text-left py-3 px-3">Waiting Since</th>
                      <th className="text-left py-3 px-3">Status</th>
                      <th className="text-left py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recipients.sort((a, b) => b.urgency - a.urgency).map(r => (
                      <tr key={r.recipientId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 text-white font-medium">{r.requiredOrgan}</td>
                        <td className="py-3 px-3"><span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded">{r.bloodGroup}</span></td>
                        <td className="py-3 px-3 text-slate-300">{r.age}</td>
                        <td className="py-3 px-3 text-slate-300">{r.location}</td>
                        <td className="py-3 px-3">
                          <Badge label={`${r.urgency}/10`} variant={r.urgency >= 8 ? 'red' : r.urgency >= 5 ? 'yellow' : 'green'} />
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <Badge label={r.status} variant={r.status === 'waiting' ? 'yellow' : 'blue'} />
                        </td>
                        <td className="py-3 px-3">
                          <button onClick={() => handleDeleteRecipient(r.recipientId)}
                            className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs px-2 py-1 rounded transition-colors">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Allocations ── */}
          {tab === 'allocations' && (
            <div className="space-y-4">
              {allocations.length === 0 ? (
                <div className="text-center py-16 text-slate-500">No allocations yet.</div>
              ) : (
                [...allocations].reverse().map(a => (
                  <div key={a.allocationId} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-semibold">{a.organType} Allocation</span>
                      <span className="text-slate-400 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-800/60 rounded-lg p-3 text-sm">
                        <p className="text-slate-400 text-xs mb-1">Donor</p>
                        {a.donor ? <p className="text-white">{a.donor.organType} · {a.donor.bloodGroup} · Age {a.donor.age} · {a.donor.location}</p> : <p className="text-slate-500">{a.donorId}</p>}
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-3 text-sm">
                        <p className="text-slate-400 text-xs mb-1">Recipient</p>
                        {a.recipient ? <p className="text-white">{a.recipient.requiredOrgan} · {a.recipient.bloodGroup} · Age {a.recipient.age} · {a.recipient.location}</p> : <p className="text-slate-500">{a.recipientId}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge label={`Urgency ${a.reason.urgency}/10`} variant="red" />
                      {a.reason.compatibilityFactors.map((f, i) => <Badge key={i} label={f} variant="blue" />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Activity Log ── */}
          {tab === 'logs' && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">System Activity Log ({logs.length})</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No activity yet.</div>
                ) : (
                  logs.map(l => (
                    <div key={l.logId} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border-l-2 ${
                      l.severity === 'critical' ? 'border-l-red-500 bg-red-900/10' :
                      l.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-900/10' :
                      'border-l-blue-500 bg-blue-900/10'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-semibold">{l.action}</span>
                          <span className="text-slate-500 text-xs">by {l.actor}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{l.details}</p>
                      </div>
                      <span className="text-slate-600 text-[10px] flex-shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
