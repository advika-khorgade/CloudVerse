'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

const severityColor: Record<string, string> = {
  info:     'border-l-blue-500 bg-blue-900/10',
  warning:  'border-l-yellow-500 bg-yellow-900/10',
  critical: 'border-l-red-500 bg-red-900/10',
  success:  'border-l-green-500 bg-green-900/10',
};

const severityDot: Record<string, string> = {
  info: 'bg-blue-400', warning: 'bg-yellow-400', critical: 'bg-red-400', success: 'bg-green-400',
};

export default function NotificationBell() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(session?.userId);
      setNotifications(data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 8000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const handleMarkAll = async () => {
    await api.markAllRead();
    fetchNotifications();
  };

  const handleMarkOne = async (id: string) => {
    await api.markRead(id);
    fetchNotifications();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-400 hover:text-blue-300">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id}
                  onClick={() => !n.read && handleMarkOne(n.id)}
                  className={`px-4 py-3 border-b border-slate-800 border-l-2 cursor-pointer hover:bg-slate-800/50 transition-colors ${severityColor[n.severity]} ${!n.read ? 'opacity-100' : 'opacity-60'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot[n.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{n.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-slate-600 text-[10px] mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
