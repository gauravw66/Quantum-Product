'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Play, 
  Save,
  BrainCircuit,
  FileCode2
} from 'lucide-react';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function AIBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);


  const handleGenerate = async () => {
    setGeneratedCode('');
    setIsSynthesizing(true);
    try {
      const response = await fetch('/api/generate-circuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        if (value) {
          buffer += new TextDecoder().decode(value);
          // Process SSE events in buffer
          let eventIdx;
          while ((eventIdx = buffer.indexOf('\n\n')) !== -1) {
            const eventStr = buffer.slice(0, eventIdx).trim();
            buffer = buffer.slice(eventIdx + 2);
            if (eventStr.startsWith('data:')) {
              try {
                const data = JSON.parse(eventStr.replace(/^data:/, '').trim());
                if (data.qasm) setGeneratedCode(data.qasm);
                if (data.done) {
                  setIsSynthesizing(false);
                  done = true;
                  break;
                }
                if (data.error) {
                  toast.error('AI generation failed', { description: data.error });
                  setIsSynthesizing(false);
                  done = true;
                  break;
                }
              } catch { /* ignore malformed stream chunk */ }
            }
          }
        }
        if (doneReading) break;
      }
    } catch {
      setIsSynthesizing(false);
      toast.error('Failed to generate circuit.');
    }
  };

  const handleRun = async () => {
    setIsExecuting(true);
    try {
      const res = await api.post('/jobs/run', { code: generatedCode, backend: 'ibm_fez' });
      toast.success('Job submitted successfully', {
        description: `IBM Job ID: ${res.data.ibmJobId}`,
      });
    } catch (error: unknown) {
      toast.error('Execution failed', {
        description: getApiErrorMessage(error, 'Failed to execute circuit.'),
      });
    }
    setIsExecuting(false);
  };

  const showEditorEmptyState = !isSynthesizing && !generatedCode;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">AI Studio</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">AI Circuit Builder</h1>
          <p className="max-w-2xl text-sm text-slate-400 lg:text-base">Describe your quantum task and generate OpenQASM optimized for IBM hardware.</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-hidden xl:flex-row">
        {/* Left: Input & Tools */}
        <div className="flex w-full flex-col space-y-4 xl:w-[360px] 2xl:w-[420px]">
          <div className="flex-1 rounded-2xl border border-white/10 bg-card/75 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center mb-4 text-accent">
              <Sparkles className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase tracking-widest text-xs">AURA AI Engine</span>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Generate a 3-qubit GHZ state circuit for Heron architecture..."
              className="h-[220px] w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-4 text-white placeholder-slate-500 transition-all focus:border-accent focus:ring-accent sm:text-sm"
            />

            <button
              onClick={handleGenerate}
              disabled={isSynthesizing || !prompt}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-4 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.995] disabled:opacity-50"
            >
              {isSynthesizing ? 'Synthesizing...' : (
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
                    className="block w-full rounded-xl border border-white/10 bg-slate-900/50 p-3 text-left text-xs text-slate-400 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Actions */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/75 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-6 py-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-400">
                main.qasm
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRun}
                disabled={!generatedCode || isExecuting}
                className="inline-flex items-center rounded-xl bg-success px-4 py-2 text-sm font-bold text-white transition-all hover:bg-success/90 active:scale-[0.98] disabled:opacity-50"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Run Live
              </button>
              <button className="inline-flex items-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-700 active:scale-[0.98]">
                <Save className="mr-2 h-4 w-4" />
                Save
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden pt-2">
            {showEditorEmptyState ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-500">
                  <FileCode2 className="h-6 w-6" />
                </div>
                <h2 className="text-base font-semibold text-slate-200">No circuit generated yet</h2>
                <p className="max-w-md text-sm text-slate-500">Enter a prompt and click Generate Circuit to stream OpenQASM into the editor.</p>
              </div>
            ) : isSynthesizing && !generatedCode ? (
              <div className="space-y-3 px-6 py-6">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`editor-loading-${index}`}
                    className="h-4 animate-pulse rounded bg-slate-800"
                    style={{ width: `${92 - index * 4}%` }}
                  />
                ))}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
