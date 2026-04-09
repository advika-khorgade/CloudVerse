interface BadgeProps { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray'; }

const variants = {
  green:  'bg-green-900/50 text-green-300 border border-green-700',
  red:    'bg-red-900/50 text-red-300 border border-red-700',
  yellow: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  blue:   'bg-blue-900/50 text-blue-300 border border-blue-700',
  gray:   'bg-slate-700/50 text-slate-300 border border-slate-600',
};

export default function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
