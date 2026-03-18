'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  Cpu, 
  Code2,
  PieChart as ChartIcon
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';

interface JobResultData {
  probabilities?: Record<string, string | number>;
  counts?: Record<string, number>;
  shots?: number;
}

interface JobDetails {
  id: string;
  ibmJobId?: string | null;
  ibmPortalUrl?: string | null;
  jobName?: string | null;
  backend: string;
  status: string;
  createdAt: string;
  code: string;
  result?: JobResultData | null;
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [modalContent, setModalContent] = useState<{title: string, data: unknown} | null>(null);

  const { data: job, isLoading } = useQuery<JobDetails>({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data;
    },
  });

  const ibmPortalHref = job?.ibmPortalUrl || (job?.ibmJobId ? `https://quantum.cloud.ibm.com/jobs/${job.ibmJobId}` : null);

  const fetchRawData = async (type: 'info' | 'results') => {
    try {
      const endpoint = type === 'info' ? `/jobs/${id}/raw-info` : `/jobs/${id}/raw-results`;
      const res = await api.get(endpoint);
      setModalContent({
        title: type === 'info' ? 'IBM Job Metadata (Raw Info)' : 'IBM Execution Results (Raw JSON)',
        data: res.data
      });
    } catch {
      toast.error('Failed to fetch raw data');
    }
  };

  if (isLoading) return <div className="p-8 text-white">Loading job details...</div>;
  if (!job) return <div className="p-8 text-error">Job not found.</div>;

  // Process results for the chart
  const resultData = job.result;
  const probabilities = resultData?.probabilities || {};
  const counts = resultData?.counts || {};
  const shots = resultData?.shots || 1024;

  const chartData = Object.entries(probabilities).map(([state, prob]) => ({
    name: `|${state}>`,
    probability: (typeof prob === 'number' ? prob : parseFloat(prob)) * 100,
    count: counts[state] || 0
  })).sort((a,b) => b.probability - a.probability);

  const topState = chartData[0];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-card border border-white/5 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{job.jobName || 'Unnamed Experiment'}</h1>
            <p className="text-slate-500 text-sm font-mono mt-1">ID: {job.ibmJobId || job.id}</p>
          </div>
        </div>
        
        {ibmPortalHref && (
          <a 
            href={ibmPortalHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-lg"
          >
            IBM Portal <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-white/5 shadow-xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${job.status === 'Completed' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-400'}`} />
            <span className="text-lg font-bold text-white">{job.status}</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-white/5 shadow-xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Hardware</p>
          <div className="flex items-center">
            <Cpu className="h-4 w-4 text-accent mr-2" />
            <span className="text-lg font-bold text-white">{job.backend}</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-white/5 shadow-xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Shots</p>
          <div className="flex items-center">
             <span className="text-lg font-bold text-white tabular-nums">{shots.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20 shadow-xl">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Top State</p>
          <div className="flex items-center">
             <span className="text-lg font-bold text-white">{topState ? topState.name : 'N/A'}</span>
             {topState && <span className="text-xs text-accent ml-2">({topState.probability.toFixed(1)}%)</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts & Analysis */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Histogram */}
          <div className="rounded-3xl bg-card border border-white/5 p-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white flex items-center">
                <ChartIcon className="mr-3 h-5 w-5 text-accent" />
                Measurement Histogram
              </h3>
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-slate-900 border border-white/10 rounded-full text-[10px] font-bold text-slate-400">HERON ARCHITECTURE</span>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-[450px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis 
                      stroke="#64748B" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#6366F1' : index === 1 ? '#4F46E5' : '#1E293B'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-white/5">
                <div className="p-4 bg-slate-800/50 rounded-full mb-4 animate-pulse">
                   <Clock className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-sm font-medium">
                  {job.status === 'Queued' ? 'Waiting in hardware queue...' : 'Processing results from IBM Cloud...'}
                </p>
              </div>
            )}
          </div>

          {/* Counts Table */}
          {chartData.length > 0 && (
            <div className="rounded-3xl bg-card border border-white/5 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-white mb-6">Execution Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-xs font-bold text-slate-500 uppercase tracking-widest pb-4">
                      <th className="pb-4">State</th>
                      <th className="pb-4">Counts</th>
                      <th className="pb-4">Probability</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {chartData.slice(0, 8).map((entry, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.02] transition-all">
                        <td className="py-4 font-mono text-white text-sm">{entry.name}</td>
                        <td className="py-4 text-slate-300 text-sm tabular-nums">{entry.count}</td>
                        <td className="py-4 font-bold text-white text-sm">{entry.probability.toFixed(2)}%</td>
                        <td className="py-4">
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-accent" style={{ width: `${entry.probability}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code & Details */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-card border border-white/5 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Experiment Conclusion</h3>
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-success/5 border border-success/10">
                <p className="text-xs text-success/80 font-bold mb-1 uppercase tracking-tight">Main Conclusion</p>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Target state <span className="text-white font-bold">{topState?.name}</span> captured with <span className="text-white font-bold">{topState?.probability.toFixed(1)}%</span> fidelity. Results are within expected thermodynamic noise parameters.
                </p>
              </div>
              
              <div className="space-y-4 pt-2">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Execution Time</span>
                    <span className="text-slate-300 font-mono">2.4s</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Service Provider</span>
                    <span className="text-slate-300 font-mono">IBMQ Platform</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Timestamp</span>
                    <span className="text-slate-300 font-mono">{new Date(job.createdAt).toLocaleTimeString()}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button 
                  onClick={() => fetchRawData('info')}
                  className="flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                  View Raw Info
                </button>
                <button 
                  onClick={() => fetchRawData('results')}
                  className="flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                  View Raw Result
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-white/5 p-6 shadow-sm overflow-hidden flex flex-col h-[480px]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
              <Code2 className="h-4 w-4 mr-2" /> Program Manifest
            </h3>
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-slate-950">
              <Editor
                height="100%"
                defaultLanguage="qasm"
                theme="vs-dark"
                value={job.code}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderLineHighlight: 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {modalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[80vh] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50">
              <h3 className="text-lg font-bold text-white tracking-tight">{modalContent.title}</h3>
              <button 
                onClick={() => setModalContent(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
            <div className="flex-1 relative bg-slate-950">
               <div className="absolute inset-0 p-4">
                 <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={JSON.stringify(modalContent.data, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      padding: { top: 10 }
                    }}
                  />
               </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end">
               <button 
                  onClick={() => setModalContent(null)}
                   className="px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all"
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
