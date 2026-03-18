'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { isAxiosError } from 'axios';

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const signupMutation = useMutation({
    mutationFn: async (data: SignupPayload) => {
      const res = await api.post('/auth/signup', data);
      return res.data;
    },
    onSuccess: () => {
      router.push('/login?registered=true');
    },
  });

  const signupErrorMessage = (() => {
    if (!signupMutation.error) return null;
    if (isAxiosError<ApiErrorPayload>(signupMutation.error)) {
      return signupMutation.error.response?.data?.error || signupMutation.error.response?.data?.message || 'Failed to create account. Please try again.';
    }
    if (signupMutation.error instanceof Error) return signupMutation.error.message;
    return 'Failed to create account. Please try again.';
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ name, email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-xl border border-white/5">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Join the Pulse</h1>
          <p className="mt-2 text-sm text-slate-400">Create your quantum developer account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:ring-accent sm:text-sm"
                placeholder="Gaurav Waghmare"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:ring-accent sm:text-sm"
                placeholder="gaurav@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:ring-accent sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {signupErrorMessage && (
            <div className="rounded-lg bg-error/10 p-3 text-sm text-error border border-error/20">
              {signupErrorMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="group relative flex w-full justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {signupMutation.isPending ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-accent hover:text-accent/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
