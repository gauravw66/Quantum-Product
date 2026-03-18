'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { 
  Key, 
  ShieldCheck, 
  Cloud,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface QuantumAccountItem {
  id: string;
  name?: string | null;
  apiToken: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<QuantumAccountItem[]>({
    queryKey: ['quantum-accounts'],
    queryFn: async () => {
      const res = await api.get('/quantum/accounts');
      return res.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async ({ token, name }: { token: string, name: string }) => {
      const res = await api.post('/quantum/connect', { apiToken: token, name });
      return res.data;
    },
    onSuccess: () => {
      toast.success('IBM Quantum account connected successfully.');
      setApiKey('');
      setApiKeyName('');
      queryClient.invalidateQueries({ queryKey: ['quantum-accounts'] });
    },
    onError: (error: unknown) => {
      toast.error('Connection failed', {
        description: getApiErrorMessage(error, 'Failed to connect IBM account.'),
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quantum/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantum-accounts'] });
    }
  });

  return (
    <div className="max-w-5xl space-y-8 lg:space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Settings</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">Cloud Configuration</h1>
        <p className="max-w-2xl text-sm text-slate-400 lg:text-base">Manage IBM API credentials and secure account connectivity for job execution.</p>
      </div>

      {/* IBM Connector */}
      <div className="rounded-2xl border border-white/10 bg-card/75 p-6 shadow-xl backdrop-blur-sm lg:p-8">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                placeholder="Enter your IBM Cloud API Key (starts with MS_...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-12 pr-4 py-4 text-white placeholder-slate-500 transition-all focus:border-accent focus:ring-accent tabular-nums"
              />
            </div>
            <input
              type="text"
              placeholder="Key Name (e.g. Research, Test, ... )"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-white placeholder-slate-500 transition-all focus:border-accent focus:ring-accent tabular-nums"
            />
          </div>
          <div className="flex items-start space-x-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              We encrypt your keys using AES-256 before storing them. They are only decrypted temporarily when submitting jobs to IBM servers. We recommend using a key with restricted permissions.
            </p>
          </div>
          <button
            onClick={() => connectMutation.mutate({ token: apiKey, name: apiKeyName })}
            disabled={!apiKey || !apiKeyName || connectMutation.isPending}
            className="flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.995] disabled:opacity-50"
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
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`account-skeleton-${index}`} className="h-20 rounded-2xl border border-white/10 bg-card/70" />
            ))}
          </div>
        ) : Array.isArray(accounts) && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/75 p-6 transition-all hover:border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{acc.name || 'IBM Quantum Account'}</h4>
                    <p className="text-xs font-mono text-slate-500">****{acc.apiToken?.slice(-8) || '********'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-xs font-bold text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-success mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Online
                  </div>
                  <button
                    className="ml-4 rounded-lg bg-error/20 px-3 py-1 text-xs font-bold text-error transition-all hover:bg-error/40 active:scale-[0.98]"
                    onClick={() => deleteMutation.mutate(acc.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Remove
                  </button>
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
