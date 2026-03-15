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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl">
      <div className="flex h-full flex-col px-3 py-4">
        {/* Logo */}
        <div className="mb-10 flex items-center px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
            <Zap className="h-6 w-6 text-white text-fill" />
          </div>
          <span className="ml-3 text-xl font-bold tracking-tight text-white">Quantum</span>
        </div>

        {/* Navigation */}
        <ul className="space-y-2 font-medium flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg p-3 transition-colors group",
                    isActive 
                      ? "bg-accent/10 text-accent" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-accent" : "text-slate-400 group-hover:text-white"
                  )} />
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User / Logout */}
        <div className="border-t border-white/5 pt-4 pb-2">
          <div className="mb-4 flex items-center px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role || 'Developer'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center rounded-lg p-3 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
