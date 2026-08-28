import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Clock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Building2, Eye } from 'lucide-react';
import { publicTrackComplaint } from '../services/api';

export default function PublicTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [complaintId, setComplaintId] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSearch = async (idToSearch) => {
    const query = idToSearch || complaintId;
    if (!query.trim()) {
      setError('Please enter a Complaint ID (e.g., CMP-4F03A5FD)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setComplaint(null);
      const data = await publicTrackComplaint(query.trim());
      setComplaint(data);
      setSearchParams({ id: query.trim() });
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        `No grievance found with ID '${query.trim()}'. Please verify the tracking code.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const base = import.meta.env.VITE_API_BASE_URL;
    const clean = imagePath.replace(/\\/g, '/');
    const norm = clean.startsWith('/') ? clean : `/${clean}`;
    return base ? `${base}${norm}` : norm;
  };

  return (
    <div className="w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header & Search Bar */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-govblue-600 dark:text-govblue-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
          Public Grievance Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Enter your unique Grievance Tracking ID to inspect real-time progress, SLA deadlines, and resolution remarks.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3 pt-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CMP-4F03A5FD)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold text-sm shadow-md transition-all shrink-0 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Record'}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-100/90 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Case Details File */}
      {complaint && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl space-y-6">
          
          {/* Top Banner */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-govblue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-govblue-700 dark:text-govblue-300 bg-white dark:bg-slate-950 px-3 py-1 rounded-xl border border-govblue-200 dark:border-govblue-800">
                  {complaint.complaint_id}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Registered: {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Outfit']">
                {complaint.category} Grievance
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                {complaint.summary || complaint.complaint}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase shadow-sm ${
                complaint.status === 'Resolved' ? 'bg-emerald-600 text-white' :
                complaint.status === 'In Progress' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                ● {complaint.status || 'Pending'}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Priority: <strong className="text-orange-600">{complaint.priority_level} ({complaint.priority_score}/100)</strong>
              </span>
            </div>
          </div>

          {/* Grid Information */}
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Key Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Department</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{complaint.assigned_department || 'General Administration'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Reported Site / Ward</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{complaint.location || 'Constituency Area'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">SLA Target Deadline</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {complaint.sla_deadline ? new Date(complaint.sla_deadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Standard SLA'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned Officer</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{complaint.assigned_to || 'Assigned to Ward Engineer'}</p>
              </div>
            </div>

            {/* Photo Evidence (if any) */}
            {complaint.image_path && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Verified Photographic Evidence
                </h4>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={getImageUrl(complaint.image_path)}
                    alt="Evidence"
                    className="h-36 w-48 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Photo+Attached'; }}
                  />
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p><strong>AI Visual Status:</strong> {complaint.verification_status || 'Verified Proof'}</p>
                    {complaint.image_summary && <p className="italic">"{complaint.image_summary}"</p>}
                    <p className="text-slate-400 text-[11px]">📍 Geo Coordinates: {complaint.latitude}° N, {complaint.longitude}° E</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Case Activity & Redressal History
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-2">
                {complaint.activity_log && complaint.activity_log.length > 0 ? (
                  complaint.activity_log.map((act, aIdx) => (
                    <div key={aIdx} className="pt-2 first:pt-0 flex items-start justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-govblue-600 dark:text-govblue-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Initial grievance registration recorded in database.</p>
                )}
              </div>
            </div>

            {/* Resolution Remarks (if resolved) */}
            {complaint.resolution_remarks && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block uppercase">
                  ✓ Official Resolution Remarks
                </span>
                <p className="text-emerald-800 dark:text-emerald-200">{complaint.resolution_remarks}</p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
