import React from 'react';

export default function ActivitySummaryCard({ summaryData }) {
  if (!summaryData || !summaryData.summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-12 text-xs">
        No live activities summary loaded.
      </div>
    );
  }

  const { summary } = summaryData;

  // Split summary string by sentences for readable bullet points
  const bulletPoints = summary
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-lg p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 h-32 w-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          {/* Glowing Emblem */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4.5 w-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.43c1.002-.5 2.096-.135 2.76.71l1.833 2.33M21 21.001c0 .414-.336.75-.75.75H3.75a.75.75 0 01-.75-.75V3.75a.75.75 0 01.75-.75h16.5a.75.75 0 01.75.75v17.25z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold font-['Outfit'] tracking-wide text-slate-100 uppercase">
              Constituency Live Insights
            </h3>
            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              AI-Generated Intelligence
            </span>
          </div>
        </div>

        {/* Dynamic Sentences */}
        <div className="space-y-3">
          {bulletPoints.map((point, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0 shadow shadow-blue-400/50"></span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {point}.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 mt-6 relative z-10 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <span>Audited in Real-Time</span>
        <span className="text-blue-400">Live Sync</span>
      </div>
    </div>
  );
}
