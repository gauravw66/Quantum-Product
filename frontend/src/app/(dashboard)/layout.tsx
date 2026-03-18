'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card/60 p-8 backdrop-blur">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-700/60" />
          <div className="mb-3 h-3 w-full animate-pulse rounded bg-slate-800/70" />
          <div className="mb-3 h-3 w-5/6 animate-pulse rounded bg-slate-800/70" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800/70" />
        </div>
      </div>
    );
  }

  // If no user and not loading, we'll let the useEffect handle redirect, 
  // but for a brief moment we might return null to prevent flash.
  if (!user && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_40%)]" />
      <Sidebar />
      <main className="ml-20 flex-1 md:ml-64">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
