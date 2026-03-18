'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Box, 
  Cpu, 
  History, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Modules', icon: Box, href: '/modules' },
  { name: 'AI Builder', icon: Cpu, href: '/ai' },
  { name: 'Jobs', icon: History, href: '/jobs' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isProfileActive = pathname === '/profile';

  const displayName =
    user?.name ||
    (typeof user?.email === 'string' ? user.email.split('@')[0] : null) ||
    'User';
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'U';
  const subtitle = user?.email || 'Developer';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 border-r border-white/10 bg-slate-950/70 backdrop-blur-xl md:w-64">
      <div className="flex h-full flex-col px-2 py-4 md:px-3">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center px-1 py-4 md:mb-10 md:justify-start md:px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/30 transition-transform duration-200 hover:scale-105">
            <Zap className="h-6 w-6 text-white text-fill" />
          </div>
          <span className="ml-3 hidden text-xl font-bold tracking-tight text-white md:inline">Quantum</span>
        </div>

        {/* Navigation */}
        <ul className="flex-1 space-y-2 font-medium">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={item.name}
                  className={cn(
                    'group flex items-center justify-center rounded-xl p-3 transition-all duration-200 md:justify-start',
                    isActive 
                      ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]'
                      : 'text-slate-400 hover:-translate-y-0.5 hover:bg-slate-900/80 hover:text-white'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-accent' : 'text-slate-400 group-hover:text-white'
                  )} />
                  <span className="ml-3 hidden text-sm md:inline">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User / Logout */}
        <div className="border-t border-white/10 pb-2 pt-4">
          <Link
            href="/profile"
            title="Profile"
            className={cn(
              'mb-3 flex items-center justify-center rounded-xl border px-2 py-3 transition-all md:justify-start md:px-4',
              isProfileActive
                ? 'border-accent/35 bg-accent/10'
                : 'border-white/10 bg-slate-900/60 hover:bg-slate-900 hover:border-white/20'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
              {avatarLetter}
            </div>
            <div className="ml-3 hidden overflow-hidden md:block">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            title="Sign Out"
            className="group flex w-full items-center justify-center rounded-xl p-3 text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 md:justify-start"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3 hidden text-sm md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
