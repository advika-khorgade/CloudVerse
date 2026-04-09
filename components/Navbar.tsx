'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const { session, logout, isAdmin, isDonor, isRecipient } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const publicLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/donors', label: 'Donors' },
    { href: '/recipients', label: 'Recipients' },
    { href: '/allocations', label: 'Allocations' },
  ];

  const roleLinks = isAdmin
    ? [{ href: '/admin', label: '⚙️ Admin' }]
    : isDonor
    ? [{ href: '/my-donor', label: '🫀 My Portal' }]
    : isRecipient
    ? [{ href: '/my-recipient', label: '🏥 My Portal' }]
    : [];

  const allLinks = [...publicLinks, ...roleLinks];

  const handleLogout = () => { logout(); router.push('/'); };

  const navBg = theme === 'dark'
    ? 'bg-slate-900/95 border-slate-700/60'
    : 'bg-white/95 border-slate-200';

  const linkActive = theme === 'dark'
    ? 'bg-blue-600 text-white'
    : 'bg-blue-600 text-white';

  const linkInactive = theme === 'dark'
    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';

  return (
    <nav className={`${navBg} border-b sticky top-0 z-50 backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            🫀
          </div>
          <span className={`font-bold text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            OrganMatch
          </span>
          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot inline-block" />
            Live
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {allLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${path === l.href ? linkActive : linkInactive}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {session ? (
            <>
              <NotificationBell />
              <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-yellow-400' : isDonor ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{session.name}</span>
                <span className={`text-xs capitalize ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>({session.role})</span>
              </div>
              <button onClick={handleLogout}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                Sign in
              </Link>
              <Link href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm px-4 py-1.5 rounded-lg transition-all font-medium">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
