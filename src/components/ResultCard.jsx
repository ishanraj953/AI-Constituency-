import React from 'react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const {
    category,
    urgency,
    priority_score,
    priority_level,
    summary,
    beneficiaries,
    location,
    similar_count,
  } = result;

  // Badge coloring helper for Urgency and Priority
  const getSeverityStyles = (level) => {
    const norm = (level || '').toLowerCase();
    if (norm === 'high' || norm === 'critical') {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-500',
        text: 'text-rose-700',
        fill: 'fill-rose-500'
      };
    }
    if (norm === 'medium' || norm === 'moderate') {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        fill: 'fill-amber-500'
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      fill: 'fill-emerald-500'
    };
  };

  const urgencyStyle = getSeverityStyles(urgency);
  const priorityStyle = getSeverityStyles(priority_level);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all duration-300">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-govblue-700 to-govblue-900 px-6 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-wider text-govblue-200 font-semibold">AI Analysis Result</span>
            <h3 className="text-lg font-bold font-['Outfit'] mt-0.5">Submission Processed</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Saved to Database
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Metric Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Category</span>
            <span className="text-sm font-bold text-slate-800 break-words">{category || 'Uncategorized'}</span>
          </div>

          {/* Urgency */}
          <div className={`border rounded-xl p-4 flex flex-col justify-between ${urgencyStyle.bg}`}>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-75 block mb-1">Urgency</span>
            <span className="text-sm font-bold flex items-center gap-1.5 capitalize">
              <span className={`h-2.5 w-2.5 rounded-full ${urgencyStyle.dot}`}></span>
              {urgency || 'Low'}
            </span>
          </div>

          {/* Priority Level */}
          <div className={`border rounded-xl p-4 flex flex-col justify-between ${priorityStyle.bg}`}>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-75 block mb-1">Priority Level</span>
            <span className="text-sm font-bold flex items-center gap-1.5 capitalize">
              <span className={`h-2.5 w-2.5 rounded-full ${priorityStyle.dot}`}></span>
              {priority_level || 'Low'}
            </span>
          </div>

          {/* Priority Score */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority Score</span>
              <span className="text-sm font-bold text-slate-800">{priority_score ?? 0}/100</span>
            </div>
            {/* Score progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className="bg-govblue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, priority_score ?? 0))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Similar Count & Location */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-govblue-600 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="font-semibold text-slate-700">Location:</span> {location}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 sm:ml-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-govblue-50 text-govblue-700 border border-govblue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.68 9.547 4.636 10.768 4.636 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.43.138-3.662z" />
              </svg>
              {similar_count ?? 0} similar complaints found in area
            </span>
          </div>
        </div>

        {/* Summary Details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">AI Executive Summary</h4>
            <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {summary || 'No summary generated.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Potential Beneficiaries</h4>
            <div className="flex items-start gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-slate-400 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-govblue-500">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <p className="text-slate-700 text-sm font-medium">
                {beneficiaries || 'General public'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
