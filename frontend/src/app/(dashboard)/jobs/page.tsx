'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Search, 
  RefreshCcw,
  ExternalLink,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';

const SEARCH_DEBOUNCE_MS = 450;

interface JobListItem {
  id: string;
  ibmJobId?: string | null;
  jobName?: string | null;
  backend: string;
  status: string;
  createdAt: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const { data: jobs, isLoading, refetch, isRefetching } = useQuery<JobListItem[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs');
      return res.data;
    },
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const filteredJobs = useMemo(() => {
    if (!Array.isArray(jobs)) return [];

    const needle = appliedSearch.trim().toLowerCase();
    if (!needle) return jobs;

    return jobs.filter((job) => {
      const haystack = [
        job.jobName,
        job.ibmJobId,
        job.id,
        job.backend,
        job.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [jobs, appliedSearch]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  const openJobDetails = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, jobId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openJobDetails(jobId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
          <div className="h-8 w-52 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-800" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="h-10 w-80 max-w-full animate-pulse rounded-xl bg-slate-800" />
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-800" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`job-skeleton-${index}`} className="grid grid-cols-5 gap-4 rounded-xl border border-white/5 bg-slate-900/35 p-4">
                <div className="h-4 animate-pulse rounded bg-slate-800" />
                <div className="h-4 animate-pulse rounded bg-slate-800" />
                <div className="h-4 animate-pulse rounded bg-slate-800" />
                <div className="h-4 animate-pulse rounded bg-slate-800" />
                <div className="h-4 animate-pulse rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operations</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">Execution History</h1>
          <p className="max-w-2xl text-sm text-slate-400 lg:text-base">Track queued, running, and completed workloads across your connected IBM backends.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/45 px-3 py-1.5 text-xs text-slate-400">
          <span>{filteredJobs.length} jobs</span>
          {appliedSearch && <span className="text-slate-500">Filtered by: {appliedSearch}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-card px-3 py-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:border-white/20 hover:text-white active:scale-[0.98]"
          >
            <RefreshCcw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <form onSubmit={handleSearch} className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center md:w-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-accent transition-colors" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Job ID or name..."
                className="w-full rounded-xl border border-white/10 bg-card py-2.5 pl-10 pr-4 text-sm text-white shadow-sm transition-all focus:border-accent focus:outline-none sm:w-80"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent/90 active:scale-[0.98]"
            >
              Search
            </button>
            {appliedSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-card px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:text-white active:scale-[0.98]"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/75 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-slate-900 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-8 py-5">Job ID & Name</th>
                <th className="px-6 py-5">Backend</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Created</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openJobDetails(job.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, job.id)}
                  className="group cursor-pointer transition-all hover:bg-slate-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
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
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-accent border border-white/5 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-14 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-slate-400">
                      <Inbox className="h-8 w-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">
                        {appliedSearch ? `No jobs found for "${appliedSearch}".` : 'No jobs found yet.'}
                      </p>
                      <p className="text-xs text-slate-500">Run a module or AI-generated circuit to see execution records here.</p>
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
