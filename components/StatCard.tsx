interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  sub?: string;
}

const colorMap = {
  green:  'bg-green-900/40 border-green-700 text-green-400',
  blue:   'bg-blue-900/40 border-blue-700 text-blue-400',
  yellow: 'bg-yellow-900/40 border-yellow-700 text-yellow-400',
  red:    'bg-red-900/40 border-red-700 text-red-400',
  purple: 'bg-purple-900/40 border-purple-700 text-purple-400',
};

export default function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
