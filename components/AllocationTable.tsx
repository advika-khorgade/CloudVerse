'use client';
import { Allocation } from '@/lib/types';
import Badge from './Badge';
import DistanceBadge from './DistanceBadge';

interface Props { allocations: Allocation[]; }

export default function AllocationTable({ allocations }: Props) {
  if (allocations.length === 0) return (
    <div className="text-center py-12 text-slate-500">No allocations yet.</div>
  );

  return (
    <div className="space-y-4">
      {[...allocations].reverse().map(a => (
        <div key={a.allocationId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-white font-semibold text-base">{a.organType} Allocation</span>
              <p className="text-slate-400 text-xs mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {a.reason.priorityScore !== undefined && (
                <span className="text-xs bg-blue-900/40 border border-blue-700 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  Score: {a.reason.priorityScore}
                </span>
              )}
              <Badge label="Successful" variant="green" />
            </div>
          </div>

          {/* Donor / Recipient cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Donor</p>
              {a.donor ? (
                <div className="space-y-1 text-sm">
                  <p className="text-white">{a.donor.organType} · <span className="font-mono">{a.donor.bloodGroup}</span></p>
                  <p className="text-slate-400">Age {a.donor.age} · {a.donor.location}</p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs font-mono">{a.donorId}</p>
              )}
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Recipient</p>
              {a.recipient ? (
                <div className="space-y-1 text-sm">
                  <p className="text-white">{a.recipient.requiredOrgan} · <span className="font-mono">{a.recipient.bloodGroup}</span></p>
                  <p className="text-slate-400">Age {a.recipient.age} · {a.recipient.location}</p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs font-mono">{a.recipientId}</p>
              )}
            </div>
          </div>

          {/* Distance badge */}
          {a.donor && a.recipient && (
            <div className="mb-3">
              <DistanceBadge
                distanceKm={a.reason.distanceKm}
                donorCity={a.donor.location}
                recipientCity={a.recipient.location}
              />
            </div>
          )}

          {/* Transparency panel */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">
              Allocation Reason — Transparency
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge label={`Urgency: ${a.reason.urgency}/10`} variant="red" />
              <Badge label={`Waiting since: ${new Date(a.reason.waitingTime).toLocaleDateString()}`} variant="yellow" />
              {a.reason.compatibilityFactors.map((f, i) => (
                <Badge key={i} label={f} variant="blue" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
