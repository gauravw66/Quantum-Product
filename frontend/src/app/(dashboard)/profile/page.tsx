'use client';

import { useQuery } from '@tanstack/react-query';
import { UserCircle2, Mail, KeyRound, Activity } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface QuantumAccountItem {
  id: string;
}

interface DashboardStats {
  total?: number;
  completed?: number;
  failed?: number;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<QuantumAccountItem[]>({
    queryKey: ['quantum-accounts'],
    queryFn: async () => {
      const res = await api.get('/quantum/accounts');
      return res.data;
    },
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/jobs/stats');
      return res.data;
    },
  });

  if (isLoading || isLoadingAccounts || isLoadingStats) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
          <div className="h-8 w-44 animate-pulse rounded bg-slate-700" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 p-8 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-2xl bg-slate-800" />
            <div className="w-full space-y-3">
              <div className="h-5 w-48 animate-pulse rounded bg-slate-700" />
              <div className="h-4 w-64 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-40 animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-slate-400">Profile not available. Please sign in again.</div>;
  }

  const displayName =
    user?.name ||
    (typeof user?.email === 'string' ? user.email.split('@')[0] : null) ||
    'User';
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Account</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">Profile</h1>
        <p className="text-sm text-slate-400 lg:text-base">Your account identity and quantum platform usage.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/75 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-3xl font-bold text-white">
            {avatarLetter}
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-white text-2xl font-bold">
              <UserCircle2 className="mr-2 h-6 w-6 text-accent" />
              {displayName}
            </div>
            <div className="flex items-center text-slate-400">
              <Mail className="mr-2 h-4 w-4" />
              {user.email || 'No email found'}
            </div>
            <div className="text-xs text-slate-500 font-mono">ID: {user.id || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-card/75 p-6 shadow-lg transition-all hover:border-white/20">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Connected Keys</div>
          <div className="flex items-center text-white text-2xl font-bold">
            <KeyRound className="mr-2 h-5 w-5 text-accent" />
            {Array.isArray(accounts) ? accounts.length : 0}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/75 p-6 shadow-lg transition-all hover:border-white/20">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Total Jobs</div>
          <div className="flex items-center text-white text-2xl font-bold">
            <Activity className="mr-2 h-5 w-5 text-accent" />
            {stats?.total || 0}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/75 p-6 shadow-lg transition-all hover:border-white/20">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Completed</div>
          <div className="text-white text-2xl font-bold">{stats?.completed || 0}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/75 p-6 shadow-lg transition-all hover:border-white/20">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Failed</div>
          <div className="text-white text-2xl font-bold">{stats?.failed || 0}</div>
        </div>
      </div>
    </div>
  );
}
