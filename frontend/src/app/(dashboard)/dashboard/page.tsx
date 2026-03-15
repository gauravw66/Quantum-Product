'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/jobs/stats');
      return res.data;
    },
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs?limit=5');
      return res.data;
    },
  });

  const cards = [
    { name: 'Total Jobs', value: stats?.total || 0, icon: History, color: 'text-blue-400' },
    { name: 'Successful', value: stats?.completed || 0, icon: CheckCircle2, color: 'text-success' },
    { name: 'Failed', value: stats?.failed || 0, icon: AlertCircle, color: 'text-error' },
    { name: 'Avg. Queue Time', value: stats?.avgTime || '1.2s', icon: Activity, color: 'text-accent' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="mt-2 text-slate-400">Monitor your quantum computations and backend status.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="relative overflow-hidden rounded-2xl bg-card p-6 border border-white/5 shadow-sm">
            <div className="flex items-center">
              <div className={`rounded-xl bg-slate-900 p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-slate-400">{card.name}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Jobs Section */}
      <div className="rounded-2xl bg-card border border-white/5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Recent Workloads</h2>
          <Link href="/jobs" className="flex items-center text-sm font-medium text-accent hover:text-accent/80 transition-colors">
            View all jobs <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Job ID</th>
                <th className="px-6 py-4">Backend</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentJobs?.length > 0 ? (
                recentJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-900/30 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-mono text-slate-300">{job.ibmJobId || job.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-slate-300">{job.backend}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No recent jobs found. Start by running a module or custom circuit.
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
