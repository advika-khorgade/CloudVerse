'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { Recipient, Allocation, Donor } from '@/lib/types';
import RecipientForm from '@/components/RecipientForm';
import Badge from '@/components/Badge';
import CountdownTimer from '@/components/CountdownTimer';
import Chatbot from '@/components/Chatbot';
import { DonutChart, SimpleBarChart } from '@/components/Charts';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'register' | 'status' | 'chat';

export default function MyRecipientPage() {
  const { session, isRecipient } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [myRecipients, setMyRecipients] = useState<Recipient[]>([]);
  const [myAllocations, setMyAllocations] = useState<Allocation[]>([]);
  const [availableDonors, setAvailableDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!session) { router.push('/login'); return; }
    if (!isRecipient) { router.push('/'); return; }
  }, [session, isRecipient, router]);

  const fetchData = useCallback(async () => {
    if (!session) return;
    const [recipients, allocations, donors] = await Promise.all([
      api.getRecipients(), api.getAllocations(), api.getDonors(),
    ]);
    setMyRecipients(recipients.filter(r => r.userId === session.userId));
    setMyAllocations(allocations.filter(a => a.recipient?.userId === session.userId));
    setAvailableDonors(donors.filter(d => d.status === 'available'));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (!session || !isRecipient) return null;

  const waiting   = myRecipients.filter(r => r.status === 'waiting');
  const allocated = myRecipients.filter(r => r.status === 'allocated');
  const myRequest = waiting[0] || allocated[0];

  const bg     = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const cardBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const tabActive   = 'bg-blue-600 text-white';
  const tabInactive = isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',  label: 'Overview', icon: '📊' },
    { id: 'register',  label: 'Request',  icon: '➕' },
    { id: 'status',    label: 'Status',   icon: '📋' },
    { id: 'chat',      label: 'AI Chat',  icon: '🤖' },
  ];

  // Urgency bar chart data
  const urgencyData = myRecipients.map(r => ({
    name: r.requiredOrgan,
    value: r.urgency,
    fill: r.urgency >= 8 ? '#ef4444' : r.urgency >= 5 ? '#eab308' : '#22c55e',
  }));

  // Organ availability chart
  const organAvailData = ['Heart','Liver','Kidney','Lung','Pancreas','Cornea'].map(o => ({
    name: o,
    value: availableDonors.filter(d => d.organType === o).length,
  })).filter(d => d.value > 0);

  return (
    <div className={`min-h-screen ${bg} -mt-8 -mx-4 px-4 pt-8 pb-12`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero */}
        <div className={`${cardBg} border rounded-2xl p-6 bg-gradient-to-r from-emerald-600/10 to-blue-600/10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-2xl">
                🏥
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Welcome, {session.name}
                </h1>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Recipient Portal · {waiting.length > 0 ? 'On waiting list' : allocated.length > 0 ? 'Organ allocated ✅' : 'Not registered yet'}
                </p>
              </div>
            </div>
            {myRequest && (
              <div className="text-right">
                <Badge
                  label={myRequest.status === 'waiting' ? `Urgency ${myRequest.urgency}/10` : 'Allocated ✅'}
                  variant={myRequest.status === 'allocated' ? 'green' : myRequest.urgency >= 8 ? 'red' : myRequest.urgency >= 5 ? 'yellow' : 'green'}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {myRequest.requiredOrgan} · {myRequest.bloodGroup}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status banner */}
        {waiting.length > 0 && (
          <div className={`${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300'} border rounded-xl p-4 flex items-center gap-4`}>
            <span className="text-3xl">⏳</span>
            <div className="flex-1">
              <p className={`font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>You are on the waiting list</p>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Waiting for {waiting[0].requiredOrgan} · Urgency {waiting[0].urgency}/10 · Since {new Date(waiting[0].timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className={`text-right text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <p>{availableDonors.filter(d => d.organType === waiting[0].requiredOrgan).length} matching donors available</p>
            </div>
          </div>
        )}

        {allocated.length > 0 && (
          <div className={`${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'} border rounded-xl p-4 flex items-center gap-4`}>
            <span className="text-3xl">✅</span>
            <div>
              <p className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-800'}`}>Organ has been allocated to you!</p>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Contact your hospital immediately to proceed with the transplant.</p>
            </div>
          </div>
        )}

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
          <div className="text-center py-16 text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Waiting',   value: waiting.length,   color: 'text-yellow-400', bg: isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200' },
                    { label: 'Allocated', value: allocated.length, color: 'text-green-400',  bg: isDark ? 'bg-green-900/20 border-green-800'  : 'bg-green-50 border-green-200' },
                    { label: 'Available Donors', value: availableDonors.length, color: 'text-blue-400', bg: isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
                      <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {urgencyData.length > 0 && <SimpleBarChart data={urgencyData} title="My Urgency Scores" yLabel="Urgency" />}
                  {organAvailData.length > 0 && <SimpleBarChart data={organAvailData} title="Available Donors by Organ" yLabel="Count" />}
                </div>

                {/* Available donors list */}
                <div className={`${cardBg} border rounded-2xl p-5`}>
                  <h2 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Available Donors in System
                    <span className="ml-2 text-sm font-normal text-slate-400">({availableDonors.length})</span>
                  </h2>
                  {availableDonors.length === 0 ? (
                    <p className={`text-center py-6 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No donors currently available.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableDonors.map(d => (
                        <div key={d.donorId} className={`flex items-center justify-between ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-lg px-3 py-2`}>
                          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {d.organType} · <span className="font-mono">{d.bloodGroup}</span> · {d.location}
                          </span>
                          <CountdownTimer expiryTime={d.expiryTime} status={d.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Register ── */}
            {tab === 'register' && (
              <div className={`${cardBg} border rounded-2xl p-6`}>
                <h2 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Join Waiting List</h2>
                <p className={`text-sm mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Submit your organ request. You'll be matched based on urgency, waiting time, and compatibility.
                </p>
                <RecipientForm onSuccess={() => { fetchData(); setTab('status'); toast.success('Added to waiting list!'); }} />
              </div>
            )}

            {/* ── Status ── */}
            {tab === 'status' && (
              <div className="space-y-4">
                {myRecipients.length === 0 ? (
                  <div className={`${cardBg} border rounded-2xl p-12 text-center`}>
                    <p className="text-5xl mb-3">🏥</p>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Not on the waiting list yet</p>
                    <button onClick={() => setTab('register')}
                      className="mt-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium">
                      Join Waiting List
                    </button>
                  </div>
                ) : (
                  myRecipients.map(r => (
                    <div key={r.recipientId} className={`${cardBg} border rounded-2xl p-5`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.requiredOrgan} Request</h3>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Submitted {new Date(r.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge label={r.status} variant={r.status === 'waiting' ? 'yellow' : 'green'} />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {[
                          { label: 'Blood Group', value: r.bloodGroup },
                          { label: 'Age', value: String(r.age) },
                          { label: 'Location', value: r.location },
                          { label: 'Urgency', value: `${r.urgency}/10` },
                        ].map(f => (
                          <div key={f.label} className={`${isDark ? 'bg-slate-800/60' : 'bg-slate-50'} rounded-lg p-3`}>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{f.label}</p>
                            <p className={`font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Urgency bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Urgency Level</span>
                          <span className={r.urgency >= 8 ? 'text-red-400' : r.urgency >= 5 ? 'text-yellow-400' : 'text-green-400'}>{r.urgency}/10</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <div className={`h-2 rounded-full ${r.urgency >= 8 ? 'bg-red-500' : r.urgency >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${r.urgency * 10}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Allocation received */}
                {myAllocations.map(a => (
                  <div key={a.allocationId} className={`${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-300'} border rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>✅ {a.organType} Allocated to You</span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    {a.donor && (
                      <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-lg p-3 text-sm mb-3`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Donor details</p>
                        <p className={isDark ? 'text-white' : 'text-slate-900'}>{a.donor.organType} · {a.donor.bloodGroup} · Age {a.donor.age} · {a.donor.location}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {a.reason.compatibilityFactors.map((f, i) => <Badge key={i} label={f} variant="blue" />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Chat ── */}
            {tab === 'chat' && (
              <div className="max-w-2xl mx-auto">
                <Chatbot role="recipient" userName={session.name} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
