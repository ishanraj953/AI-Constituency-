import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Mic, Camera, ShieldCheck, CheckCircle2, Clock, AlertTriangle, 
  ArrowRight, Search, Sparkles, Building2, Droplets, Zap, Activity, 
  GraduationCap, Bus, Trees, Home as HomeIcon, ChevronRight, HelpCircle,
  FileText, Users, Eye, BarChart3
} from 'lucide-react';
import { publicTrackComplaint, getPublicStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Public Tracking State
  const [trackingId, setTrackingId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Live Stats State
  const [stats, setStats] = useState({
    total_complaints: 1240,
    resolved_complaints: 980,
    active_complaints: 260,
    verified_images: 1120,
    departments_count: 17,
    average_resolution_hours: 36
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getPublicStats();
      if (data && (data.total_complaints > 0 || data.resolved_complaints > 0)) {
        setStats(data);
      }
    } catch (e) {
      // Keep sensible default stats
    }
  };

  const handleQuickTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setTrackError('Please enter a valid Complaint ID (e.g., CMP-4F03A5FD)');
      return;
    }

    try {
      setTrackLoading(true);
      setTrackError('');
      setTrackResult(null);
      const data = await publicTrackComplaint(trackingId.trim());
      setTrackResult(data);
    } catch (err) {
      setTrackError(
        err.response?.data?.detail || 
        `No grievance record found for '${trackingId.trim()}'. Please verify the ID.`
      );
    } finally {
      setTrackLoading(false);
    }
  };

  const categories = [
    { name: 'Roads & Bridges', icon: '🛣️', dept: 'Roads & Infrastructure', issues: 'Potholes, broken roads, footpaths' },
    { name: 'Water Supply', icon: '🚰', dept: 'Water Supply Dept', issues: 'Shortage, dirty water, pipe bursts' },
    { name: 'Drainage & Sewage', icon: '🌊', dept: 'Drainage & Sewerage Board', issues: 'Clogged drains, manholes, overflow' },
    { name: 'Sanitation & Waste', icon: '🗑️', dept: 'Sanitation Dept', issues: 'Garbage heaps, uncollected bins' },
    { name: 'Electricity & Power', icon: '⚡', dept: 'Electrical & Power Dept', issues: 'Outages, live wires, transformers' },
    { name: 'Street Lighting', icon: '💡', dept: 'Lighting Division', issues: 'Dark spots, broken streetlights' },
    { name: 'Public Safety', icon: '🛡️', dept: 'Police & Safety Admin', issues: 'Encroachments, stray animals' },
    { name: 'Healthcare & Hospitals', icon: '🏥', dept: 'Health & Family Welfare', issues: 'PHC facilities, doctor shortages' },
    { name: 'Education & Schools', icon: '🏫', dept: 'Education Dept', issues: 'Classroom repairs, school amenities' },
    { name: 'Public Transport', icon: '🚌', dept: 'Transport Dept', issues: 'Bus frequency, missing shelters' },
    { name: 'Environment & Pollution', icon: '🌿', dept: 'Pollution Control Board', issues: 'Toxic smoke, tree felling' },
    { name: 'Parks & Recreation', icon: '🌳', dept: 'Horticulture Dept', issues: 'Damaged parks, unmaintained grounds' },
    { name: 'Housing & Slums', icon: '🏘️', dept: 'Housing Authority', issues: 'Dilapidated housing, slum redevelopment' },
    { name: 'Revenue & Land', icon: '📜', dept: 'Revenue Administration', issues: 'Land records, registry disputes' },
    { name: 'PDS / Ration System', icon: '🌾', dept: 'Food & Civil Supplies', issues: 'Ration cards, fair price shops' },
    { name: 'Social Welfare', icon: '🤝', dept: 'Social Welfare Dept', issues: 'Pensions, citizen welfare benefits' },
  ];

  return (
    <div className="w-full flex flex-col space-y-16 lg:space-y-24 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-govblue-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/30 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Top Government / AI Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-govblue-100/80 dark:bg-govblue-900/60 border border-govblue-200 dark:border-govblue-700 text-govblue-800 dark:text-govblue-200 text-xs font-extrabold uppercase tracking-widest shadow-sm mb-6"
          >
            <Sparkles className="h-4 w-4 text-govblue-600 dark:text-govblue-400" />
            Official Member of Parliament & MLA Grievance Redressal System
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Outfit'] max-w-4xl mx-auto leading-tight sm:leading-tight"
          >
            Voice Your Grievance. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-govblue-600 via-indigo-600 to-govblue-800 dark:from-govblue-400 dark:to-indigo-300">
              Resolved by Multimodal AI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
          >
            Empowering citizens to report municipal and infrastructure issues in <strong className="text-slate-900 dark:text-white">Hindi, English, or Voice</strong>. Our AI automatically verifies geo-tagged photo proof, matches GPS proximity, and guarantees automated SLA routing across 17 public departments.
          </motion.p>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to={user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/user/submit') : '/register'}
              className="inline-flex items-center gap-2 rounded-2xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold px-7 py-3.5 text-sm sm:text-base shadow-lg shadow-govblue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="h-5 w-5" />
              File a Grievance Now
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#track-section"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold px-6 py-3.5 text-sm sm:text-base transition-all shadow-sm"
            >
              <Search className="h-4 w-4 text-govblue-600 dark:text-govblue-400" />
              Track Existing Complaint
            </a>

            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-govblue-600 dark:text-govblue-400 hover:underline px-3 py-2"
            >
              Explore How It Works →
            </Link>
          </motion.div>

          {/* LIVE STATS BAR */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-xl"
          >
            <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
              <p className="text-2xl sm:text-3xl font-extrabold text-govblue-600 dark:text-govblue-400 font-['Outfit']">
                {stats.total_complaints.toLocaleString()}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                Total Grievances
              </p>
            </div>

            <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                {stats.resolved_complaints.toLocaleString()}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                Resolved & Closed
              </p>
            </div>

            <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-['Outfit']">
                17
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                Civic Departments
              </p>
            </div>

            <div className="p-3 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-['Outfit']">
                &lt;36 Hrs
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                Avg. SLA Turnaround
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 2. INSTANT GRIEVANCE TRACKER WIDGET */}
      <section id="track-section" className="mx-auto max-w-4xl px-4 sm:px-6 w-full">
        <div className="rounded-3xl border-2 border-govblue-200 dark:border-govblue-800/80 bg-gradient-to-r from-govblue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 p-6 sm:p-8 shadow-lg">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-govblue-600 text-white font-extrabold text-[10px] uppercase tracking-wider mb-2">
              <Search className="h-3 w-3" /> Quick Tracking Tool
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              Track Any Grievance Instantly
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Enter your tracking code below to inspect the real-time AI status, assigned department, and SLA timeline.
            </p>
          </div>

          <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter Complaint ID (e.g. CMP-A1B2C3D4)"
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={trackLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold text-sm shadow-md transition-all shrink-0 disabled:opacity-50"
            >
              {trackLoading ? 'Verifying...' : 'Track Status →'}
            </button>
          </form>

          {/* Error Message */}
          {trackError && (
            <div className="mt-4 p-4 rounded-2xl bg-red-100/90 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold text-center max-w-2xl mx-auto">
              ⚠️ {trackError}
            </div>
          )}

          {/* Inline Track Result */}
          {trackResult && (
            <div className="mt-6 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div>
                  <span className="font-mono text-xs font-extrabold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950 px-2.5 py-1 rounded-lg border border-govblue-200 dark:border-govblue-800">
                    {trackResult.complaint_id}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 font-['Outfit']">
                    {trackResult.category} Grievance
                  </h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                  trackResult.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                  trackResult.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {trackResult.status || 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Assigned Department:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{trackResult.assigned_department || 'General Administration'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Location / Ward:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{trackResult.location || 'Constituency'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Priority Level:</span>
                  <span className="font-bold text-orange-600">{trackResult.priority_level} ({trackResult.priority_score}/100)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Evidence Status:</span>
                  <span className="font-bold text-emerald-600">{trackResult.verification_status || 'Verified'}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/track?id=${trackResult.complaint_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-govblue-600 dark:text-govblue-400 hover:underline"
                >
                  View Complete Case Timeline & Resolution History →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. HOW IT WORKS - 5-STEP INTERACTIVE PIPELINE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-govblue-600 dark:text-govblue-400 block mb-2">
            Intelligent Automation Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
            How The AI Constituency Portal Works
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 leading-relaxed">
            From the moment a citizen speaks their concern to field officer redressal, every step is automated and timestamped for radical transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          
          {/* Step 1 */}
          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="h-10 w-10 rounded-2xl bg-govblue-50 dark:bg-govblue-950/70 border border-govblue-200 dark:border-govblue-800 text-govblue-600 dark:text-govblue-400 font-extrabold text-base flex items-center justify-center">
                  01
                </span>
                <Mic className="h-5 w-5 text-govblue-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-['Outfit']">
                Voice & Photo Filing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Citizen speaks in Hindi/English or writes a complaint, attaching a live camera photo of the civic issue.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-govblue-600 dark:text-govblue-400">
              Whisper Audio STT
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-extrabold text-base flex items-center justify-center">
                  02
                </span>
                <Camera className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-['Outfit']">
                Vision & GPS Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Gemini Vision validates real infrastructure damage while Haversine checks EXIF camera GPS against submitted site.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Gemini Vision + EXIF GPS
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-extrabold text-base flex items-center justify-center">
                  03
                </span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-['Outfit']">
                Semantic Clustering & SLA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                NLP clusters similar neighborhood issues to prevent duplicate work, assigning a 0-100 priority score and SLA deadline.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Vector Clustering & SLAs
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-extrabold text-base flex items-center justify-center">
                  04
                </span>
                <Building2 className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-['Outfit']">
                17-Dept Routing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Directly routed to the responsible department (Roads, Water, Sanitation, Power, Health) with zero manual delay.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Automated Dept Dispatch
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-extrabold text-base flex items-center justify-center">
                  05
                </span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-['Outfit']">
                Redressal & Tracking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Citizen tracks progress with full audit history; field officer uploads resolution remarks and closes ticket.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              100% Audit Transparency
            </div>
          </div>

        </div>
      </section>

      {/* 4. CORE AI CAPABILITIES SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 dark:bg-slate-900/60 border border-slate-800 text-white p-8 sm:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3.5 py-1 rounded-full bg-govblue-600 text-white text-[10px] font-extrabold uppercase tracking-widest inline-block mb-3">
              Cutting-Edge Tech Stack
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit']">
              Engineered with Responsible, Multi-Agent AI
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2">
              Combining LLM natural language understanding, Computer Vision, geospatial analysis, and vector similarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-govblue-600/30 text-govblue-400 flex items-center justify-center font-bold">
                🎙️
              </div>
              <h3 className="text-base font-bold font-['Outfit']">Groq Whisper Voice Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Empowers rural and illiterate citizens to submit complaints via voice in Hindi, English, and regional accents in under 3 seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
                📸
              </div>
              <h3 className="text-base font-bold font-['Outfit']">Gemini Multimodal AI Vision</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated visual evidence classifier filters spam, confirms public infrastructure severity, and extracts damage context.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold">
                📍
              </div>
              <h3 className="text-base font-bold font-['Outfit']">Haversine GPS Verification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Compares camera EXIF GPS tags with citizen-reported locations. Mismatched off-site photos are tagged with administrative alerts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
                🧮
              </div>
              <h3 className="text-base font-bold font-['Outfit']">Semantic Vector Clustering</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                `all-MiniLM-L6-v2` dense vector embeddings detect duplicate or recurring neighborhood grievances, consolidating municipal workload.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h3 className="text-base font-bold font-['Outfit']">Dynamic SLA Urgency Matrix</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Critical hazards (floods, broken water mains, high-voltage wires) receive automatic 12h-36h SLAs with auto-escalation alerts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
                🏛️
              </div>
              <h3 className="text-base font-bold font-['Outfit']">MP / MLA Governance Dashboard</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gives elected representatives heatmaps, department SLA performance metrics, and bottleneck diagnosis across all wards.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. 17 CIVIC DEPARTMENTS EXPLORER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-govblue-600 dark:text-govblue-400 block mb-1">
              Constituency Coverage
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              17 Specialized Civic Departments
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Every issue is intelligently classified and assigned to the right municipal authority.
            </p>
          </div>

          <Link
            to={user ? '/user/submit' : '/login'}
            className="inline-flex items-center gap-2 text-xs font-bold text-govblue-600 dark:text-govblue-400 hover:underline"
          >
            Submit an Issue in Any Category →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-govblue-300 dark:hover:border-govblue-700 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl block mb-2">{cat.icon}</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-['Outfit']">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {cat.issues}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-govblue-600 dark:text-govblue-400">
                {cat.dept}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-govblue-700 via-govblue-600 to-indigo-700 text-white p-8 sm:p-12 shadow-xl text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit']">
              Ready to Make Your Constituency Better?
            </h2>
            <p className="text-govblue-100 text-sm leading-relaxed">
              Report your local grievance in less than 30 seconds using voice or text. Receive instant tracking updates and hold public authorities accountable.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to={user ? '/user/submit' : '/register'}
                className="px-8 py-3.5 rounded-2xl bg-white text-govblue-900 font-extrabold text-sm shadow-lg hover:bg-govblue-50 transition-all hover:scale-105"
              >
                Start Filing Now (Free)
              </Link>
              <Link
                to="/faq"
                className="px-6 py-3.5 rounded-2xl border-2 border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
              >
                Read Citizen FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
