import React, { useState } from 'react';
import ComplaintForm from '../components/ComplaintForm';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleStart = () => {
    setLoading(true);
    setResult(null);
    setError(null);
  };

  const handleSuccess = (data) => {
    setLoading(false);
    setResult(data);
  };

  const handleFailure = (msg) => {
    setLoading(false);
    setError(msg);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full">
      {/* Hero Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center md:text-left mb-10"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl font-['Outfit']">
          Citizen Grievance Redressal Portal
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-2xl">
          Submit your concerns directly to your local representative. Our AI engine automatically processes, categorizes, and tracks your complaint in real-time.
        </p>
      </motion.div>

      {/* Main Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Side: Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <ComplaintForm
            onSubmitStart={handleStart}
            onSubmitSuccess={handleSuccess}
            onSubmitError={handleFailure}
          />
        </div>

        {/* Right Side: Results or Instructions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm" role="alert">
              <div className="flex gap-3">
                <div className="text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800 font-['Outfit']">Submission Failed</h3>
                  <p className="mt-1 text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex items-center justify-center min-h-[300px]">
              <Loader message="AI is processing your complaint, matching similarities, and calculating priority scores..." />
            </div>
          )}

          {/* AI Result Card */}
          {result && !loading && (
            <ResultCard result={result} />
          )}

          {/* Default Info Guide (When idle and no result) */}
          {!result && !loading && !error && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-['Outfit']">How the AI Engine Works</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Once you hit submit, the system initiates the following automated workflow:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-govblue-50 text-govblue-700 font-bold text-sm shrink-0 border border-govblue-100">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit']">Categorization</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Categorizes the grievance (e.g. Sanitation, Water Supply, Electricity) using LLMs.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-govblue-50 text-govblue-700 font-bold text-sm shrink-0 border border-govblue-100">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit']">Urgency & Priority</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Calculates urgency and computes a numeric priority score (0-100) dynamically.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-govblue-50 text-govblue-700 font-bold text-sm shrink-0 border border-govblue-100">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit']">Similarity Engine</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Cross-references coordinates and content to count duplicate/similar claims.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-govblue-50 text-govblue-700 font-bold text-sm shrink-0 border border-govblue-100">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit']">MP Dispatch</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Stores to MongoDB and updates the analytical dashboard in real time.</p>
                  </div>
                </div>
              </div>

              {/* Graphical placeholder representing security */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3">
                <div className="text-govblue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div className="text-xs text-slate-500 font-medium leading-normal">
                  Your grievance is secure under municipal encryption standards. Only verified officers and constituency leaders have access to full reports.
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
