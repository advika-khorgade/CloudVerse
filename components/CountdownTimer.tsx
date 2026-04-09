'use client';
import { useEffect, useState } from 'react';

interface Props { expiryTime: string; status: string; }

function msToHMS(ms: number) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

export default function CountdownTimer({ expiryTime, status }: Props) {
  const [remaining, setRemaining] = useState(new Date(expiryTime).getTime() - Date.now());

  useEffect(() => {
    if (status !== 'available') return;
    const id = setInterval(() => {
      setRemaining(new Date(expiryTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiryTime, status]);

  if (status === 'allocated') return <span className="text-green-400 text-xs font-medium">Allocated</span>;
  if (status === 'expired' || remaining <= 0) return <span className="text-red-400 text-xs font-medium">Expired</span>;

  const color = remaining < 3600000 ? 'text-red-400' : remaining < 7200000 ? 'text-yellow-400' : 'text-green-400';

  return <span className={`font-mono text-xs font-semibold ${color}`}>{msToHMS(remaining)}</span>;
}
