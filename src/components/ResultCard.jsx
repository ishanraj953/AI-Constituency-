import React, { useState } from 'react';
import { Check, Copy, Hash, MapPin, Users, ShieldCheck, Tag, AlertTriangle, Image as ImageIcon } from 'lucide-react';

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const {
    complaint_id,
    category,
    urgency,
    priority_score,
    priority_level,
    summary,
    beneficiaries,
    location,
    similar_count,
    image_path,
    verification_status,
    detected_category,
    detected_severity,
    image_summary
  } = result;

  const displayId = complaint_id || 'CMP-PENDING';

  const handleCopyId = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Badge coloring helper for Urgency and Priority
  const getSeverityStyles = (level) => {
    const norm = (level || '').toLowerCase();
    if (norm === 'high' || norm === 'critical') {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
        dot: 'bg-rose-500'
      };
    }
    if (norm === 'medium' || norm === 'moderate') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500'
      };
    }
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500'
    };
  };

  const urgencyStyle = getSeverityStyles(urgency);
  const priorityStyle = getSeverityStyles(priority_level);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden transition-all duration-300">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-govblue-700 via-govblue-800 to-govblue-900 px-6 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-govblue-200 font-bold">AI Grievance Confirmation</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Registered
              </span>
            </div>
            <h3 className="text-xl font-extrabold font-['Outfit'] mt-1">Complaint Successfully Filed</h3>
          </div>

          {/* Prominent Complaint No. Badge */}
          <div className="flex items-center gap-2 bg-white/10 dark:bg-slate-950/40 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl">
            <Hash className="h-4 w-4 text-govblue-200" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-govblue-200 tracking-wider">Complaint No.</div>
              <div className="font-mono text-sm font-extrabold text-white tracking-widest">{displayId}</div>
            </div>
            <button
              onClick={handleCopyId}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1 text-govblue-200 hover:text-white"
              title="Copy Complaint ID"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Metric Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Category</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words">{category || 'Uncategorized'}</span>
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
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Score</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{priority_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
              <div 
                className="bg-govblue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, priority_score ?? 0))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Similar Count & Location */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MapPin className="h-4 w-4 text-govblue-600 dark:text-govblue-400 flex-shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">Location:</span> {location}
          </div>

          <div className="flex items-center gap-2 text-sm sm:ml-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-govblue-50 dark:bg-govblue-950/60 text-govblue-700 dark:text-govblue-300 border border-govblue-200 dark:border-govblue-800/70">
              <Users className="h-3.5 w-3.5" />
              {similar_count ?? 0} duplicate/similar complaints combined in area
            </span>
          </div>
        </div>

        {/* AI Executive Summary & Visual Evidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">AI Executive Summary</h4>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {summary || 'No summary generated.'}
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Beneficiaries Impacted</h4>
            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Users className="h-4 w-4 text-govblue-500 mt-0.5" />
              <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                {beneficiaries || 'General public & constituency residents'}
              </p>
            </div>
          </div>

          {/* Visual AI Evidence Findings */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Visual Evidence Assessment
              </h4>
              {verification_status && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {verification_status}
                </span>
              )}
            </div>

            {detected_category && (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Detected Hazard: </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{detected_category}</span> ({detected_severity || 'High'} Severity)
              </div>
            )}

            {image_summary && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {image_summary}
              </p>
            )}

            <div className="pt-2 text-xs text-govblue-700 dark:text-govblue-300 flex items-center gap-1.5 font-medium">
              <span>Your tracking ID: <strong className="font-mono">{displayId}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

