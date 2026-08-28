import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/analyticsApi';
import StatisticsCards from '../components/StatisticsCards';
import TopIssuesChart from '../components/TopIssuesChart';
import CategoryPieChart from '../components/CategoryPieChart';
import PriorityChart from '../components/PriorityChart';
import WardAnalyticsChart from '../components/WardAnalyticsChart';
import ActivitySummaryCard from '../components/ActivitySummaryCard';
import Loader from '../components/Loader';

export default function Analytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const [issues, setIssues] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [priority, setPriority] = useState([]);
  const [wards, setWards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        statsRes,
        issuesRes,
        distRes,
        priorityRes,
        wardsRes,
        summaryRes
      ] = await Promise.all([
        api.getStatistics(),
        api.getTopIssues(),
        api.getCategoryDistribution(),
        api.getPriorityDistribution(),
        api.getWardAnalysis(),
        api.getActivitySummary()
      ]);

      setStats(statsRes);
      setIssues(issuesRes);
      setDistribution(distRes);
      setPriority(priorityRes);
      setWards(wardsRes);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Error fetching analytics details:', err);
      setError('Sync failure. Make sure FastAPI and MongoDB are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
            Constituency Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            AI generated insights from citizen complaints and photographic evidence
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 px-4 py-2.5 shadow-sm transition-all focus:outline-none shrink-0 justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-800 dark:text-red-300 font-semibold">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-24 flex justify-center items-center">
          <Loader message="Synthesizing Recharts Dashboard..." />
        </div>
      ) : (

        <div className="space-y-6">
          {/* Section 1: KPI Statistics cards */}
          <StatisticsCards stats={stats} />

          {/* Section 2: Issues bar & Pie distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <TopIssuesChart issues={issues} />
            <CategoryPieChart distribution={distribution} />
          </div>

          {/* Section 3: Priority Doughnut, Ward analysis, & Activity summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <PriorityChart distribution={priority} />
            <WardAnalyticsChart wards={wards} />
            <ActivitySummaryCard summaryData={summary} />
          </div>
        </div>
      )}
    </main>
  );
}

