'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import Editor from '@monaco-editor/react';
import { 
  Sparkles, 
  Play, 
  Save, 
  Send,
  Cpu,
  BrainCircuit
} from 'lucide-react';

export default function AIBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const res = await api.post('/ai/generate-circuit', { prompt: userPrompt });
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
    },
    onError: (error: any) => {
      alert(`AI Error: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleRun = async () => {
    setIsExecuting(true);
    try {
      const res = await api.post('/jobs/run-custom', { qasmCode: generatedCode, backend: 'ibm_fez' });
      alert(`Job submitted! IBM Job ID: ${res.data.ibmJobId}`);
    } catch (error: any) {
      alert(`Execution failed: ${error.response?.data?.error || error.message}`);
    }
    setIsExecuting(false);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Circuit Builder</h1>
          <p className="mt-2 text-slate-400">Describe your quantum task in natural language.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left: Input & Tools */}
        <div className="flex w-1/3 flex-col space-y-4">
          <div className="flex-1 rounded-2xl bg-card p-6 border border-white/5 shadow-sm">
            <div className="flex items-center mb-4 text-accent">
              <Sparkles className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase tracking-widest text-xs">AURA AI Engine</span>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Generate a 3-qubit GHZ state circuit for Heron architecture..."
              className="h-[200px] w-full resize-none rounded-xl bg-slate-900 border border-slate-700 p-4 text-white placeholder-slate-500 focus:border-accent focus:ring-accent sm:text-sm"
            />

            <button
              onClick={() => generateMutation.mutate(prompt)}
              disabled={generateMutation.isPending || !prompt}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-4 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Synthesizing...' : (
                <>
                  <BrainCircuit className="mr-2 h-5 w-5" />
                  Generate Circuit
                </>
              )}
            </button>

            <div className="mt-10 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Suggestions</h3>
              <div className="space-y-2">
                {[
                  "Create a Bell state (qubits 0,1)",
                  "Implement Quantum Teleportation",
                  "Prepare a superposed state with phase"
                ].map(s => (
                  <button 
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="block w-full text-left p-3 rounded-lg bg-slate-900/50 border border-white/5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Actions */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-card border border-white/5 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/50 px-6 py-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-white/5">
                main.qasm
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRun}
                disabled={!generatedCode || isExecuting}
                className="inline-flex items-center rounded-lg bg-success px-4 py-2 text-sm font-bold text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Run Live
              </button>
              <button className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 transition-colors">
                <Save className="mr-2 h-4 w-4" />
                Save
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden pt-2">
            <Editor
              height="100%"
              defaultLanguage="qasm"
              theme="vs-dark"
              value={generatedCode}
              onChange={(v) => setGeneratedCode(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                padding: { top: 20 }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
