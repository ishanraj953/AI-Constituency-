import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getComplaints } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import Loader from '../components/Loader';

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    highUrgency: 0,
    avgPriority: 0,
    similarSum: 0
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaints();
      const list = data.complaints || [];
      
      // Reverse list to show the most recent submissions first
      const reversedList = [...list].reverse();
      setComplaints(reversedList);

      // Compute statistics
      const total = reversedList.length;
      const highUrgency = reversedList.filter(
        c => c.urgency?.toLowerCase() === 'high' || c.urgency?.toLowerCase() === 'critical'
      ).length;
      const totalPriority = reversedList.reduce((acc, curr) => acc + (curr.priority_score || 0), 0);
      const avgPriority = total > 0 ? Math.round(totalPriority / total) : 0;
      const similarSum = reversedList.reduce((acc, curr) => acc + (curr.similar_count || 0), 0);

      setStats({
        total,
        highUrgency,
        avgPriority,
        similarSum
      });
    } catch (err) {
      setError('Failed to fetch constituency complaints. Please ensure the backend is running and connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full space-y-8">
      {/* Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
            MP Analytical Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time constituent issues monitoring, automated priority ranking, and regional analytics.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 rounded-lg bg-govblue-600 hover:bg-govblue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-all justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v-2.625c0-1.03-.84-1.875-1.875-1.875h-.75c-1.03 0-1.875.84-1.875 1.875v3m9 8.25H3m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12" />
            </svg>
            Analytics
          </Link>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-all shadow-sm shrink-0 justify-center font-['Inter']"
          >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Data
        </button>
      </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 font-['Outfit']">Data Sync Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total complaints */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Complaints</span>
              <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{stats.total}</span>
            </div>
            <div className="h-12 w-12 rounded-lg bg-govblue-50 border border-govblue-100 flex items-center justify-center text-govblue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </div>

          {/* Card 2: High Urgency */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">High Urgency Issues</span>
              <span className="text-3xl font-extrabold text-rose-600 font-['Outfit']">{stats.highUrgency}</span>
            </div>
            <div className="h-12 w-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>

          {/* Card 3: Avg Priority Score */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Avg Priority Score</span>
              <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{stats.avgPriority}<span className="text-sm font-medium text-slate-400">/100</span></span>
            </div>
            <div className="h-12 w-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>

          {/* Card 4: Similar Detections */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Duplications Avoided</span>
              <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{stats.similarSum}</span>
            </div>
            <div className="h-12 w-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Main List Section */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 font-['Outfit']">Recent Complaints</h2>
          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded">
            Showing {complaints.length} Records
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex justify-center items-center">
            <Loader message="Synchronizing with constituency database..." />
          </div>
        )}

        {/* Complaints Grid */}
        {!loading && !error && (
          <>
            {complaints.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-full w-full">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.25A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V15.75a2.25 2.25 0 012.25-2.25zm0-4.5h18A2.25 2.25 0 0122 13.5v4.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V13.5a2.25 2.25 0 012.25-2.25z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 font-['Outfit']">No Complaints Logged</h3>
                <p className="text-slate-500 text-xs mt-1">There are currently no active grievances submitted in the constituency database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {complaints.map((item, index) => (
                  <ComplaintCard key={index} complaintData={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
