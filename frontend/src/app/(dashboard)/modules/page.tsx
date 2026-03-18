'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { 
  Play, 
  Cpu, 
  Layers, 
  Info,
  Boxes
} from 'lucide-react';
import { useState } from 'react';

interface ModuleItem {
  id: string;
  name: string;
  description?: string | null;
}

interface BackendItem {
  name: string;
  nQubits?: number | null;
}

interface RunJobResponse {
  ibmJobId?: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function ModulesPage() {
  const queryClient = useQueryClient();
  const [selectedBackend, setSelectedBackend] = useState('ibm_fez');
  const [runningModuleId, setRunningModuleId] = useState<string | null>(null);

  const { data: modules, isLoading } = useQuery<ModuleItem[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await api.get('/modules');
      return res.data;
    },
  });

  const { data: backends } = useQuery<BackendItem[]>({
    queryKey: ['backends'],
    queryFn: async () => {
      const res = await api.get('/quantum/backends');
      return res.data;
    },
  });

  const runMutation = useMutation<RunJobResponse, unknown, string>({
    mutationFn: async (moduleId: string) => {
      setRunningModuleId(moduleId);
      const res = await api.post('/jobs/run', {
        moduleId,
        backend: selectedBackend
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Job submitted successfully', {
        description: `IBM Job ID: ${data.ibmJobId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] });
      setRunningModuleId(null);
    },
    onError: (error: unknown) => {
      toast.error('Execution failed', {
        description: getApiErrorMessage(error, 'Failed to run module.'),
      });
      setRunningModuleId(null);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
          <div className="h-8 w-56 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`module-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg backdrop-blur-sm">
              <div className="mb-5 h-12 w-12 animate-pulse rounded-xl bg-slate-800" />
              <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-slate-700" />
              <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-800" />
              <div className="mb-6 h-3 w-5/6 animate-pulse rounded bg-slate-800" />
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Library</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">Quantum Modules</h1>
          <p className="max-w-2xl text-sm text-slate-400 lg:text-base">Launch pre-built circuits tuned for IBM Quantum hardware with one click.</p>
        </div>

        {/* Backend Selector */}
        <div className="flex items-center space-x-3 rounded-2xl border border-white/10 bg-card/75 p-2 shadow-sm backdrop-blur-sm">
          <Cpu className="ml-2 h-5 w-5 text-accent" />
          <select 
            value={selectedBackend}
            onChange={(e) => setSelectedBackend(e.target.value)}
            className="cursor-pointer bg-transparent pr-8 text-sm font-semibold text-white focus:outline-none"
          >
            {backends?.map((b) => (
              <option key={b.name} value={b.name} className="bg-slate-900">
                {b.name} ({b.nQubits ?? '?'}Q)
              </option>
            )) || <option value="ibm_fez">ibm_fez (156Q)</option>}
          </select>
        </div>
      </div>

      {/* Modules Grid */}
      {Array.isArray(modules) && modules.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="group relative rounded-2xl border border-white/10 bg-card/75 p-6 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-accent/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Layers className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-semibold leading-tight text-white">{module.name}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">
                {module.description || 'Experimental quantum circuit designed for Heron architecture validation.'}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <div className="flex items-center text-xs font-medium text-slate-500">
                  <Info className="mr-1.5 h-3.5 w-3.5" />
                  ISA-Compatible
                </div>
                <button
                  onClick={() => runMutation.mutate(module.id)}
                  disabled={runningModuleId !== null}
                  className="inline-flex items-center justify-center rounded-xl bg-accent/10 px-4 py-2 text-sm font-bold text-accent transition-all hover:bg-accent hover:text-white active:scale-[0.98] disabled:opacity-50"
                >
                  {runningModuleId === module.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4 fill-current" />
                      Execute
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/35 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-slate-500">
            <Boxes className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-200">No modules available</h2>
          <p className="mt-2 text-sm text-slate-500">Module templates will appear here after the backend seed completes.</p>
        </div>
      )}
    </div>
  );
}
