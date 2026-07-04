import React from 'react';

export default function ComplaintCard({ complaintData }) {
  if (!complaintData) return null;

  const {
    category,
    urgency,
    priority_level,
    priority_score,
    summary,
    location,
    beneficiaries,
    similar_count,
  } = complaintData;

  // Severity color helpers
  const getSeverityStyle = (level) => {
    const norm = (level || '').toLowerCase();
    if (norm === 'high' || norm === 'critical') {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    if (norm === 'medium' || norm === 'moderate') {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  const urgencyClass = getSeverityStyle(urgency);
  const priorityClass = getSeverityStyle(priority_level);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner (Category and Badges) */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200 max-w-[60%] truncate">
            {category || 'General Grievance'}
          </span>
          <div className="flex gap-1.5 flex-shrink-0">
            {/* Priority Badge */}
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityClass}`}>
              P: {priority_level || 'Low'}
            </span>
            {/* Urgency Badge */}
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${urgencyClass}`}>
              U: {urgency || 'Low'}
            </span>
          </div>
        </div>

        {/* Priority Score representation */}
        <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-lg p-2 border border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Priority Score:</span>
          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-govblue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, priority_score ?? 0))}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-slate-700">{priority_score ?? 0}</span>
        </div>

        {/* Summary text */}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Grievance Summary</h4>
        <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {summary || 'No summary available.'}
        </p>
      </div>

      {/* Footer details (Location & Beneficiaries) */}
      <div className="bg-slate-50 border-t border-slate-100 p-4 px-5 space-y-2 mt-auto">
        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-govblue-600 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">
            <strong className="text-slate-600">Location: </strong>{location}
          </span>
        </div>

        {/* Beneficiaries */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-govblue-600 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="truncate">
            <strong className="text-slate-600">Beneficiaries: </strong>{beneficiaries || 'Community'}
          </span>
        </div>
      </div>
    </div>
  );
}
