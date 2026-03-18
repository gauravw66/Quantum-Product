'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  Inbox,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  total?: number;
  completed?: number;
  failed?: number;
  avgTime?: string;
}

interface RecentJob {
  id: string;
  ibmJobId?: string | null;
  backend: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/jobs/stats');
      return res.data;
    },
  });

  const { data: recentJobs, isLoading: isLoadingJobs } = useQuery<RecentJob[]>({
    queryKey: ['recent-jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs?limit=5');
      return res.data;
    },
  });

  const isLoading = isLoadingStats || isLoadingJobs;

  const cards = [
    { name: 'Total Jobs', value: stats?.total || 0, icon: History, color: 'text-blue-400' },
    { name: 'Successful', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-success' },
    { name: 'Failed', value: stats?.failed || 0, icon: AlertCircle, color: 'text-error' },
    { name: 'Avg. Runtime', value: stats?.avgTime || 'N/A', icon: Activity, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Overview</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">Quantum Dashboard</h1>
        <p className="max-w-2xl text-sm text-slate-400 lg:text-base">Monitor workloads, queue behavior, and backend execution health from one command center.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`stats-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg backdrop-blur-sm">
                <div className="mb-5 h-10 w-10 animate-pulse rounded-xl bg-slate-800" />
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-slate-700" />
                <div className="h-8 w-16 animate-pulse rounded bg-slate-700" />
              </div>
            ))
          : cards.map((card) => (
              <div
                key={card.name}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20"
              >
                <div className="flex items-center">
                  <div className={`rounded-xl bg-slate-900/85 p-3 transition-transform duration-200 group-hover:scale-105 ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-slate-400">{card.name}</p>
                    <p className="text-2xl font-semibold text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Recent Jobs Section */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/70 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Recent Workloads</h2>
          <Link href="/jobs" className="flex items-center text-sm font-medium text-accent transition-colors hover:text-accent/80">
            View all jobs <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/40 text-xs font-semibold uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Job ID</th>
                <th className="px-6 py-4">Backend</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`recent-jobs-skeleton-${index}`}>
                    <td className="px-6 py-4"><div className="h-4 w-36 animate-pulse rounded bg-slate-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-slate-800" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-slate-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-slate-800" /></td>
                  </tr>
                ))
              ) : Array.isArray(recentJobs) && recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <tr key={job.id} className="group cursor-pointer transition-colors hover:bg-slate-900/30">
                    <td className="px-6 py-4 font-mono text-slate-300">{job.ibmJobId || job.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-slate-300">{job.backend}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        job.status === 'Completed' ? 'bg-success/10 text-success' : 
                        job.status === 'Failed' ? 'bg-error/10 text-error' : 'bg-yellow-400/10 text-yellow-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                      <Inbox className="h-8 w-8 text-slate-600" />
                      <p className="text-sm">No recent jobs found.</p>
                      <p className="text-xs text-slate-600">Run a module or custom circuit to populate this table.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
