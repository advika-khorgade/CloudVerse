/**
 * Shows distance between donor and recipient with color coding.
 * Green = same/near, Yellow = far, Red = very far, Gray = unknown
 */
import { formatDistance, getDistanceCategory } from '@/lib/geography';

interface Props {
  distanceKm?: number;
  donorCity: string;
  recipientCity: string;
}

export default function DistanceBadge({ distanceKm, donorCity, recipientCity }: Props) {
  if (distanceKm === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-slate-700/50 text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full">
        📍 {donorCity} → {recipientCity} · distance unknown
      </span>
    );
  }

  const cat = getDistanceCategory(distanceKm);

  const styles = {
    same:     'bg-green-900/40 text-green-300 border-green-700',
    near:     'bg-green-900/30 text-green-400 border-green-800',
    far:      'bg-yellow-900/30 text-yellow-300 border-yellow-800',
    'very-far': 'bg-red-900/30 text-red-300 border-red-800',
  };

  const icons = {
    same: '📍', near: '🟢', far: '🟡', 'very-far': '🔴',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full ${styles[cat]}`}>
      {icons[cat]} {formatDistance(distanceKm)}
      {cat === 'same' && ' · Same city'}
      {cat === 'near' && ' · Nearby'}
      {cat === 'far' && ' · Regional'}
      {cat === 'very-far' && ' · Long distance'}
    </span>
  );
}
