import React from 'react';
import { Tag, MapPin, Users, Hash, Image as ImageIcon } from 'lucide-react';

export default function ComplaintCard({ complaintData }) {
  if (!complaintData) return null;

  const {
    complaint_id,
    category,
    urgency,
    priority_level,
    priority_score,
    summary,
    location,
    beneficiaries,
    image_path,
    created_at,
  } = complaintData;

  // Severity color helpers
  const getSeverityStyle = (level) => {
    const norm = (level || '').toLowerCase();
    if (norm === 'high' || norm === 'critical') {
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (norm === 'medium' || norm === 'moderate') {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  };

  const urgencyClass = getSeverityStyle(urgency);
  const priorityClass = getSeverityStyle(priority_level);

  // Format complaint ID nicely
  const displayId = complaint_id || (complaintData._id ? `CMP-${String(complaintData._id).slice(-6).toUpperCase()}` : 'CMP-UNKNOWN');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Banner: Complaint ID + Category + Badges */}
      <div className="p-5 pb-3">
        {/* Complaint No Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 bg-govblue-50 dark:bg-govblue-950/60 border border-govblue-200 dark:border-govblue-800/80 px-2.5 py-1 rounded-lg">
            <Hash className="h-3.5 w-3.5 text-govblue-600 dark:text-govblue-400" />
            <span className="font-mono text-xs font-extrabold text-govblue-800 dark:text-govblue-300 tracking-wider">
              {displayId}
            </span>
          </div>

          <div className="flex gap-1.5 flex-shrink-0">
            {/* Priority Badge */}
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityClass}`}>
              P: {priority_level || 'Low'}
            </span>
            {/* Urgency Badge */}
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${urgencyClass}`}>
              U: {urgency || 'Low'}
            </span>
          </div>
        </div>

        {/* Category Pill & Optional Image Indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 max-w-[70%] truncate">
            <Tag className="h-3 w-3 text-slate-500" />
            {category || 'General Grievance'}
          </span>

          {image_path && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/40 px-2 py-0.5 rounded-md border border-govblue-100 dark:border-govblue-900">
              <ImageIcon className="h-3 w-3" /> Photo Attached
            </span>
          )}
        </div>

        {/* Priority Score representation */}
        <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Score:</span>
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-govblue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, priority_score ?? 0))}%` }}
            ></div>
          </div>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{priority_score ?? 0}/100</span>
        </div>

        {/* Summary text */}
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Grievance Summary</h4>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3">
          {summary || 'No summary available.'}
        </p>
      </div>

      {/* Footer details (Location & Beneficiaries) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 p-4 px-5 space-y-1.5 mt-auto">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-govblue-600 dark:text-govblue-400 flex-shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700 dark:text-slate-300">Location: </strong>{location}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5 text-govblue-600 dark:text-govblue-400 flex-shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700 dark:text-slate-300">Beneficiaries: </strong>{beneficiaries || 'Community'}
          </span>
        </div>
      </div>
    </div>
  );
}

