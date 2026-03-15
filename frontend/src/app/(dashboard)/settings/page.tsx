'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Key, 
  Database, 
  ShieldCheck, 
  RefreshCcw,
  Cloud,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['quantum-accounts'],
    queryFn: async () => {
      const res = await api.get('/quantum/accounts');
      return res.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post('/quantum/connect', { apiToken: token });
      return res.data;
    },
    onSuccess: () => {
      alert('IBM Quantum account successfully connected!');
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['quantum-accounts'] });
    },
    onError: (error: any) => {
      alert(`Connection failed: ${error.response?.data?.error || error.message}`);
    }
  });

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Cloud Configuration</h1>
        <p className="mt-2 text-slate-400">Manage your IBM Quantum credentials and backend settings.</p>
      </div>

      {/* IBM Connector */}
      <div className="rounded-2xl bg-card p-8 border border-white/5 shadow-xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-accent/20 rounded-xl text-accent">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">IBM Cloud Connector</h2>
            <p className="text-sm text-slate-500 font-medium">Link your IAM API key to access Heron chips</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="password"
              placeholder="Enter your IBM Cloud API Key (starts with MS_...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:border-accent focus:ring-accent transition-all tabular-nums"
            />
          </div>
          
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-900/50 border border-white/5">
            <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              We encrypt your keys using AES-256 before storing them. They are only decrypted temporarily when submitting jobs to IBM servers. We recommend using a key with restricted permissions.
            </p>
          </div>

          <button
            onClick={() => connectMutation.mutate(apiKey)}
            disabled={!apiKey || connectMutation.isPending}
            className="flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:bg-accent/90 disabled:opacity-50 transition-all"
          >
            {connectMutation.isPending ? 'Verifying with IBM...' : 'Connect Quantum Account'}
          </button>
        </div>
      </div>

      {/* Managed Accounts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Active Connections</h3>
        
        {isLoadingAccounts ? (
          <div className="animate-pulse space-y-3">
             <div className="h-20 bg-card rounded-2xl border border-white/5" />
          </div>
        ) : accounts?.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-6 rounded-2xl bg-card border border-white/5">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">IBM Cloud Instance</h4>
                    <p className="text-xs font-mono text-slate-500">****{acc.apiToken.slice(-8)}</p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-bold text-slate-400">
                  <div className="h-2 w-2 rounded-full bg-success mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Online
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-white/10">
            <AlertTriangle className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">No active accounts. Connect an API key above to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
