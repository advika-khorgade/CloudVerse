'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { Donor, Allocation, DonorHealthDetails } from '@/lib/types';
import DonorForm from '@/components/DonorForm';
import DonorHealthForm from '@/components/DonorHealthForm';
import CountdownTimer from '@/components/CountdownTimer';
import Badge from '@/components/Badge';
import Chatbot from '@/components/Chatbot';
import { DonutChart, SimpleBarChart } from '@/components/Charts';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'register' | 'health' | 'history' | 'chat';

const ORGAN_ICONS: Record<string, string> = {
  Heart: '❤️', Liver: '🫁', Kidney: '🫘', Lung: '💨', Pancreas: '🧬', Cornea: '👁️',
};

export default function MyDonorPage() {
  const { session, isDonor } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [myDonors, setMyDonors] = useState<Donor[]>([]);
  const [myAllocations, setMyAllocations] = useState<Allocation[]>([]);
  const [healthDetails, setHealthDetails] = useState<DonorHealthDetails | undefined>();
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (!isDonor) { router.push('/'); return; }
  }, [session, isDonor, router]);

  const fetchData = useCallback(async () => {
    if (!session) return;
    const [donors, allocations] = await Promise.all([api.getDonors(), api.getAllocations()]);
    setMyDonors(donors.filter(d => d.userId === session.userId));
    setMyAllocations(allocations.filter(a => a.donor?.userId === session.userId));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (!session || !isDonor) return null;

  const active    = myDonors.filter(d => d.status === 'available');
  const allocated = myDonors.filter(d => d.status === 'allocated');
  const expired   = myDonors.filter(d => d.status === 'expired');

  const donutData = [
    { name: 'Available', value: active.length },
    { name: 'Allocated', value: allocated.length },
    { name: 'Expired',   value: expired.length },
  ].filter(d => d.value > 0);

  const organBarData = Object.entries(
    myDonors.reduce((acc, d) => ({ ...acc, [d.organType]: (acc[d.organType] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const bg      = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const cardBg  = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const tabActive = isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white';
  const tabInactive = isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',  label: 'Overview',  icon: '📊' },
    { id: 'register',  label: 'Register',  icon: '➕' },
    { id: 'health',    label: 'Health',    icon: '🏥' },
    { id: 'history',   label: 'History',   icon: '📋' },
    { id: 'chat',      label: 'AI Chat',   icon: '🤖' },
  ];

  return (
    <div className={`min-h-screen ${bg} -mt-8 -mx-4 px-4 pt-8 pb-12`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero header */}
        <div className={`${cardBg} border rounded-2xl p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                🫀
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Welcome, {session.name}
                </h1>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Donor Portal · {myDonors.length} organ{myDonors.length !== 1 ? 's' : ''} registered
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{allocated.length}</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Lives Saved</p>
              </div>
              <div className={`w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{active.length}</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${cardBg} border rounded-xl p-1 flex gap-1`}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${tab === t.id ? tabActive : tabInactive}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 animate-pulse">Loading your data...</div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Registered', value: myDonors.length, color: 'text-blue-400',   bg: isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200' },
                    { label: 'Available',         value: active.length,   color: 'text-green-400',  bg: isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200' },
                    { label: 'Lives Saved',       value: allocated.length,color: 'text-purple-400', bg: isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200' },
                    { label: 'Expired',           value: expired.length,  color: 'text-red-400',    bg: isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
                      <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                {myDonors.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {donutData.length > 0 && <DonutChart data={donutData} title="Donation Status Breakdown" />}
                    {organBarData.length > 0 && <SimpleBarChart data={organBarData} title="Organs by Type" yLabel="Count" />}
                  </div>
                )}

                {/* Active organs with timers */}
                {active.length > 0 && (
                  <div className={`${cardBg} border rounded-2xl p-5`}>
                    <h2 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ⏱️ Active Organs — Viability Countdown
                    </h2>
                    <div className="space-y-3">
                      {active.map(d => {
                        const msLeft = new Date(d.expiryTime).getTime() - Date.now();
                        const pct = Math.max(0, Math.min(100, (msLeft / (new Date(d.expiryTime).getTime() - new Date(d.timestamp).getTime())) * 100));
                        return (
                          <div key={d.donorId} className={`${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{ORGAN_ICONS[d.organType] || '🫀'}</span>
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.organType}</span>
                                <span className={`text-xs font-mono px-2 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{d.bloodGroup}</span>
                              </div>
                              <CountdownTimer expiryTime={d.expiryTime} status={d.status} />
                            </div>
                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <div className={`h-1.5 rounded-full transition-all ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d.location} · Age {d.age}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {myDonors.length === 0 && (
                  <div className={`${cardBg} border rounded-2xl p-12 text-center`}>
                    <p className="text-5xl mb-3">🫀</p>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>No organs registered yet</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Go to Register tab to add your first donation</p>
                    <button onClick={() => setTab('register')}
                      className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium">
                      Register Organ
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Register ── */}
            {tab === 'register' && (
              <div className={`${cardBg} border rounded-2xl p-6`}>
                <h2 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Register New Organ</h2>
                <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Fill in the organ details. Health information can be added in the Health tab.
                </p>
                <DonorForm onSuccess={() => { fetchData(); setTab('overview'); toast.success('Organ registered successfully!'); }} />
              </div>
            )}

            {/* ── Health ── */}
            {tab === 'health' && (
              <div className={`${cardBg} border rounded-2xl p-6`}>
                <h2 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Health Details</h2>
                <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  This information helps medical teams assess organ viability. All data is confidential.
                </p>
                <DonorHealthForm
                  initial={healthDetails}
                  onSave={(details) => {
                    setHealthDetails(details);
                    toast.success('Health details saved!');
                  }}
                />
              </div>
            )}

            {/* ── History ── */}
            {tab === 'history' && (
              <div className="space-y-4">
                <div className={`${cardBg} border rounded-2xl p-5`}>
                  <h2 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>All Registered Organs ({myDonors.length})</h2>
                  {myDonors.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No organs registered yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {myDonors.map(d => (
                        <div key={d.donorId} className={`flex items-center justify-between ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-xl px-4 py-3`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{ORGAN_ICONS[d.organType] || '🫀'}</span>
                            <div>
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.organType} · {d.bloodGroup}</p>
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.location} · {new Date(d.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <CountdownTimer expiryTime={d.expiryTime} status={d.status} />
                            <Badge label={d.status} variant={d.status === 'available' ? 'green' : d.status === 'allocated' ? 'blue' : 'red'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {myAllocations.length > 0 && (
                  <div className={`${cardBg} border rounded-2xl p-5`}>
                    <h2 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ✅ Lives Saved ({myAllocations.length})
                    </h2>
                    <div className="space-y-3">
                      {myAllocations.map(a => (
                        <div key={a.allocationId} className={`${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border rounded-xl p-4`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>✅ {a.organType} Allocated</span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(a.timestamp).toLocaleString()}</span>
                          </div>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Recipient urgency: {a.reason.urgency}/10
                            {a.reason.distanceKm !== undefined && ` · Distance: ${a.reason.distanceKm}km`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Chat ── */}
            {tab === 'chat' && (
              <div className="max-w-2xl mx-auto">
                <Chatbot role="donor" userName={session.name} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
