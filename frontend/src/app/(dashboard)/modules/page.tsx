'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Play, 
  Cpu, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

export default function ModulesPage() {
  const queryClient = useQueryClient();
  const [selectedBackend, setSelectedBackend] = useState('ibm_fez');
  const [runningModuleId, setRunningModuleId] = useState<string | null>(null);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await api.get('/modules');
      return res.data;
    },
  });

  const { data: backends } = useQuery({
    queryKey: ['backends'],
    queryFn: async () => {
      const res = await api.get('/quantum/backends');
      return res.data;
    },
  });

  const runMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      setRunningModuleId(moduleId);
      const res = await api.post('/jobs/run', {
        moduleId,
        backend: selectedBackend
      });
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Job submitted! IBM Job ID: ${data.ibmJobId}`);
      queryClient.invalidateQueries({ queryKey: ['recent-jobs'] });
      setRunningModuleId(null);
    },
    onError: (error: any) => {
      alert(`Execution failed: ${error.response?.data?.error || error.message}`);
      setRunningModuleId(null);
    }
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
          <h1 className="text-3xl font-bold text-white">Quantum Modules</h1>
          <p className="mt-2 text-slate-400">Select a pre-built quantum circuit to execute on real hardware.</p>
        </div>

        {/* Backend Selector */}
        <div className="flex items-center space-x-3 rounded-xl bg-card p-2 border border-white/5">
          <Cpu className="ml-2 h-5 w-5 text-accent" />
          <select 
            value={selectedBackend}
            onChange={(e) => setSelectedBackend(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white focus:outline-none pr-8 cursor-pointer"
          >
            {backends?.map((b: any) => (
              <option key={b.name} value={b.name} className="bg-slate-900">
                {b.name} ({b.nQubits}Q)
              </option>
            )) || <option value="ibm_fez">ibm_fez (156Q)</option>}
          </select>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules?.map((module: any) => (
          <div key={module.id} className="group relative rounded-2xl bg-card p-6 border border-white/5 shadow-sm transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
              <Layers className="h-6 w-6" />
            </div>
            
            <h2 className="mt-5 text-xl font-bold text-white leading-tight">{module.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 line-clamp-3">
              {module.description || "Experimental quantum circuit designed for Heron architecture validation."}
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5">
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <Info className="mr-1.5 h-3.5 w-3.5" />
                ISA-Compatible
              </div>
              <button
                onClick={() => runMutation.mutate(module.id)}
                disabled={runningModuleId !== null}
                className="inline-flex items-center justify-center rounded-lg bg-accent/10 px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
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
    </div>
  );
}
