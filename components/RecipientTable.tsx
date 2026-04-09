'use client';
import { Recipient } from '@/lib/types';
import Badge from './Badge';

interface Props { recipients: Recipient[]; }

function urgencyColor(u: number): 'red' | 'yellow' | 'green' {
  if (u >= 8) return 'red';
  if (u >= 5) return 'yellow';
  return 'green';
}

export default function RecipientTable({ recipients }: Props) {
  if (recipients.length === 0) return (
    <div className="text-center py-12 text-slate-500">No recipients on waiting list.</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4">Organ Needed</th>
            <th className="text-left py-3 px-4">Blood</th>
            <th className="text-left py-3 px-4">Age</th>
            <th className="text-left py-3 px-4">Location</th>
            <th className="text-left py-3 px-4">Urgency</th>
            <th className="text-left py-3 px-4">Waiting Since</th>
            <th className="text-left py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {recipients.map(r => (
            <tr key={r.recipientId} className="hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-4 font-medium text-white">{r.requiredOrgan}</td>
              <td className="py-3 px-4">
                <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-mono">{r.bloodGroup}</span>
              </td>
              <td className="py-3 px-4 text-slate-300">{r.age}</td>
              <td className="py-3 px-4 text-slate-300">{r.location}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${r.urgency >= 8 ? 'bg-red-500' : r.urgency >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${r.urgency * 10}%` }}
                    />
                  </div>
                  <Badge label={`${r.urgency}/10`} variant={urgencyColor(r.urgency)} />
                </div>
              </td>
              <td className="py-3 px-4 text-slate-400 text-xs">
                {new Date(r.timestamp).toLocaleString()}
              </td>
              <td className="py-3 px-4">
                <Badge label={r.status} variant={r.status === 'waiting' ? 'yellow' : 'blue'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
