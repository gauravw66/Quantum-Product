'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ChevronRight, 
  Search, 
  Filter,
  RefreshCcw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  const { data: jobs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Execution History</h1>
          <p className="mt-2 text-slate-400">Manage and track your quantum workloads across all backends.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-lg bg-card p-2.5 text-slate-400 border border-white/10 hover:text-white transition-all shadow-sm"
          >
            <RefreshCcw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Job ID..."
              className="pl-10 pr-4 py-2.5 w-64 rounded-lg bg-card border border-white/10 text-sm text-white focus:outline-none focus:border-accent transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 px-6 py-4 text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-white/5">
              <tr>
                <th className="px-8 py-5">Job ID & Name</th>
                <th className="px-6 py-5">Backend</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Created</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs?.map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-900/30 transition-all cursor-pointer group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white group-hover:text-accent transition-colors">{job.jobName || 'Unnamed Job'}</span>
                      <span className="text-xs font-mono text-slate-500">{job.ibmJobId || job.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <span className="text-slate-300 font-medium">{job.backend}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      job.status === 'Completed' ? 'bg-success/10 text-success' : 
                      job.status === 'Failed' ? 'bg-error/10 text-error' : 
                      job.status === 'Queued' ? 'bg-blue-400/10 text-blue-400' : 'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      <div className={`mr-2 h-1.5 w-1.5 rounded-full ${
                        job.status === 'Completed' ? 'bg-success' : 
                        job.status === 'Failed' ? 'bg-error' : 
                        job.status === 'Queued' ? 'bg-blue-400' : 'bg-yellow-400'
                      }`} />
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-400 tabular-nums">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <Link 
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-accent border border-white/5 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
