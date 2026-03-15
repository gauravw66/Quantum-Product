'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Zap, ArrowRight, Shield, Cpu, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl text-center space-y-10">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold">
          <Sparkles className="h-4 w-4" />
          <span>New: Support for IBM Heron 156-qubit QPUs</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
            QUANTUM <span className="text-accent underline decoration-accent/30 underline-offset-8">CLOUD</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto">
            Design, synthesize, and execute quantum circuits on the world's most advanced hardware.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent text-white font-bold text-lg shadow-2xl shadow-accent/20 hover:bg-accent/90 transition-all flex items-center justify-center group"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Pillows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
          {[
            { name: 'ISA-Native', icon: Shield, desc: 'Hardware-ready gates' },
            { name: 'AI-Powered', icon: Cpu, desc: 'Auto-synthesize QASM' },
            { name: 'Real-time', icon: Zap, desc: 'Live execution status' }
          ].map(f => (
            <div key={f.name} className="p-4 rounded-2xl bg-card border border-white/5 text-left">
              <f.icon className="h-5 w-5 text-accent mb-2" />
              <p className="text-sm font-bold text-white">{f.name}</p>
              <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
