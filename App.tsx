import React, { useState } from 'react';
import { ShieldCheck, Play, Loader2, AlertTriangle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { processFiles } from './services/emailCleaner';
import { ProcessingResult } from './types';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Small delay to allow UI to update to processing state before heavy JS loop freezes it slightly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = await processFiles(files);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("An error occurred while processing your files. Please check the format and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-brand-600 p-1.5 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CleanList Pro</h1>
          </div>
          <div className="text-sm text-slate-500">
             Local Browser Processing
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {!results ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">
                Clean your email lists in seconds.
              </h2>
              <p className="text-lg text-slate-600">
                Secure, client-side cleaning. Removes duplicates, typos, disposable emails, and role-based accounts automatically.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <FileUpload files={files} onFilesChange={setFiles} />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={handleProcess}
                  disabled={files.length === 0 || isProcessing}
                  className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl text-lg font-semibold transition-all ${
                    files.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 hover:shadow-brand-300 transform hover:-translate-y-0.5'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Start Cleaning</span>
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Files are processed entirely in your browser. No data is uploaded to any server.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
               <div className="text-center p-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Valid Syntax</h3>
                  <p className="text-sm text-slate-500 mt-1">Checks RFC compliance and structure.</p>
               </div>
               <div className="text-center p-4">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Disposable & Role</h3>
                  <p className="text-sm text-slate-500 mt-1">Filters temp mail and admin accounts.</p>
               </div>
               <div className="text-center p-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Loader2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Deduplication</h3>
                  <p className="text-sm text-slate-500 mt-1">Merges multiple CSVs and removes dupes.</p>
               </div>
            </div>
          </div>
        ) : (
          <Dashboard results={results} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;