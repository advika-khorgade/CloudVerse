'use client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#a855f7', '#06b6d4'];

interface PieProps { data: { name: string; value: number }[]; title: string; }
export function DonutChart({ data, title }: PieProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={`card ${isDark ? '' : 'shadow-sm'}`}>
      <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
            paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{d.name}</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.value}</span>
            {total > 0 && <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>({Math.round(d.value / total * 100)}%)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

interface BarProps { data: { name: string; value: number; fill?: string }[]; title: string; yLabel?: string; }
export function SimpleBarChart({ data, title, yLabel }: BarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`card ${isDark ? '' : 'shadow-sm'}`}>
      <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 } : undefined} />
          <Tooltip
            contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill || COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AreaProps { data: { name: string; [key: string]: number | string }[]; title: string; lines: { key: string; color: string; label: string }[]; }
export function SimpleAreaChart({ data, title, lines }: AreaProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`card ${isDark ? '' : 'shadow-sm'}`}>
      <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            {lines.map(l => (
              <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={l.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={l.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map(l => (
            <Area key={l.key} type="monotone" dataKey={l.key} name={l.label}
              stroke={l.color} fill={`url(#grad-${l.key})`} strokeWidth={2} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
