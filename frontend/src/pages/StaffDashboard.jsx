import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getComplaints, updateComplaintStatus, resolveComplaint, assignComplaint } from '../services/api';
import { 
  Building2, CheckCircle2, Clock, AlertTriangle, Search, Filter, 
  MapPin, Camera, User, FileText, ArrowRight, ShieldCheck, RefreshCw, Eye, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const cleanPath = imagePath.replace(/\\/g, '/');
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return base ? `${base}${normalized}` : normalized;
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search
  const [activeTab, setActiveTab] = useState('alloted'); // 'alloted' | 'dept' | 'all' | 'progress' | 'urgent' | 'resolved'
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  
  // Selected complaint for review/action
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusVal, setStatusVal] = useState('In Progress');
  const [remarksVal, setRemarksVal] = useState('');
  const [assignedToVal, setAssignedToVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgError, setMsgError] = useState('');

  useEffect(() => {
    fetchStaffComplaints();
  }, []);

  const fetchStaffComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getComplaints();
      if (data && data.complaints) {
        setComplaints(data.complaints);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load department grievances.');
    } finally {
      setLoading(false);
    }
  };

  // Distinct departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set();
    complaints.forEach((c) => {
      if (c.assigned_department) set.add(c.assigned_department);
    });
    return Array.from(set).sort();
  }, [complaints]);

  // Filtered complaints based on activeTab and searchTerm
  const filteredList = useMemo(() => {
    const userName = user?.name?.toLowerCase() || '';
    const userDept = user?.department?.toLowerCase() || '';

    return complaints.filter((c) => {
      // Text search match
      const textMatch = 
        (c.complaint_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.assigned_department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!textMatch) return false;

      // Department dropdown filter
      if (departmentFilter !== 'ALL') {
        if (c.assigned_department !== departmentFilter) return false;
      }

      const isAllotedToMe = (c.assigned_to || '').toLowerCase().includes(userName);
      const isMyDept = (c.assigned_department || '').toLowerCase().includes(userDept) ||
                       userDept.includes((c.assigned_department || '').toLowerCase());
      const isResolved = c.status === 'Resolved' || c.status === 'Closed';
      const isUrgent = c.priority_level === 'Critical' || c.priority_level === 'High' || c.escalated;

      if (activeTab === 'alloted') {
        return isAllotedToMe && !isResolved;
      } else if (activeTab === 'dept') {
        return isMyDept && !isResolved;
      } else if (activeTab === 'all') {
        return true; // Show all issues across constituency
      } else if (activeTab === 'progress') {
        return c.status === 'In Progress' || c.status === 'Assigned';
      } else if (activeTab === 'urgent') {
        return isUrgent && !isResolved;
      } else if (activeTab === 'resolved') {
        return isResolved;
      }
      return true;
    });
  }, [complaints, activeTab, searchTerm, departmentFilter, user]);

  // Counts for KPI
  const kpis = useMemo(() => {
    const userName = user?.name?.toLowerCase() || '';
    const userDept = user?.department?.toLowerCase() || '';

    const allotedCount = complaints.filter(c => 
      (c.assigned_to || '').toLowerCase().includes(userName) && c.status !== 'Resolved'
    ).length;

    const deptActive = complaints.filter(c => {
      const isMyDept = (c.assigned_department || '').toLowerCase().includes(userDept) ||
                       userDept.includes((c.assigned_department || '').toLowerCase());
      return isMyDept && c.status !== 'Resolved';
    }).length;

    const totalAllCount = complaints.length;
    const inProgressCount = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    const urgentCount = complaints.filter(c => 
      (c.priority_level === 'Critical' || c.priority_level === 'High' || c.escalated) && c.status !== 'Resolved'
    ).length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    return { allotedCount, deptActive, totalAllCount, inProgressCount, urgentCount, resolvedCount };
  }, [complaints, user]);

  const openDrawer = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusVal(complaint.status || 'In Progress');
    setRemarksVal(complaint.resolution_remarks || '');
    setAssignedToVal(complaint.assigned_to || '');
    setMsg('');
    setMsgError('');
  };

  const closeDrawer = () => {
    setSelectedComplaint(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    try {
      setSaving(true);
      setMsg('');
      setMsgError('');

      // If officer name changed
      if (assignedToVal !== selectedComplaint.assigned_to && assignedToVal.trim()) {
        await assignComplaint(selectedComplaint.complaint_id, assignedToVal.trim());
      }

      // Update status
      if (statusVal !== selectedComplaint.status) {
        await updateComplaintStatus(selectedComplaint.complaint_id, statusVal);
      }

      setMsg('Case updated successfully!');
      fetchStaffComplaints();
    } catch (err) {
      setMsgError(err.response?.data?.detail || 'Failed to update case.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint) return;
    if (!remarksVal.trim()) {
      setMsgError('Please enter resolution remarks describing the physical redressal action.');
      return;
    }

    try {
      setSaving(true);
      setMsg('');
      setMsgError('');
      await resolveComplaint(selectedComplaint.complaint_id, remarksVal.trim());
      setMsg('Complaint marked as Resolved & Closed!');
      fetchStaffComplaints();
      setTimeout(() => {
        closeDrawer();
      }, 1500);
    } catch (err) {
      setMsgError(err.response?.data?.detail || 'Failed to resolve complaint.');
    } finally {
      setSaving(false);
    }
  };

  const quickFillRemarks = (text) => {
    setRemarksVal((prev) => (prev ? `${prev} | ${text}` : text));
  };

  return (
    <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Officer Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-govblue-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5" />
            {user?.department || 'Department Operations'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
            Welcome, {user?.name || 'Department Officer'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200">
            {user?.designation || 'Field & Operations Officer'} • Unified Redressal Workspace
          </p>
        </div>

        <button
          onClick={fetchStaffComplaints}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh All Issues
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div 
          onClick={() => setActiveTab('alloted')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'alloted' 
              ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-md scale-105' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
            Alloted to Me
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {kpis.allotedCount}
          </p>
          <span className="text-[10px] text-slate-400">Direct assignments</span>
        </div>

        <div 
          onClick={() => setActiveTab('dept')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'dept' 
              ? 'border-govblue-500 bg-govblue-50/80 dark:bg-govblue-950/60 shadow-md scale-105' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-govblue-300'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-govblue-600 dark:text-govblue-400 block">
            My Dept Queue
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {kpis.deptActive}
          </p>
          <span className="text-[10px] text-slate-400">Department tickets</span>
        </div>

        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'all' 
              ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/60 shadow-md scale-105' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            All Issues
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {kpis.totalAllCount}
          </p>
          <span className="text-[10px] text-slate-400">Constituency total</span>
        </div>

        <div 
          onClick={() => setActiveTab('progress')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'progress' 
              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 shadow-md scale-105' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            In Progress
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {kpis.inProgressCount}
          </p>
          <span className="text-[10px] text-slate-400">Work ongoing</span>
        </div>

        <div 
          onClick={() => setActiveTab('urgent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'urgent' 
              ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 shadow-md scale-105' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Urgent SLAs
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {kpis.urgentCount}
          </p>
          <span className="text-[10px] text-slate-400">High priority</span>
        </div>

        <div 
          onClick={() => setActiveTab('resolved')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'resolved' 
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-md scale-105' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Resolved
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {kpis.resolvedCount}
          </p>
          <span className="text-[10px] text-slate-400">Closed tickets</span>
        </div>

      </div>

      {/* Main Issue Table / Cards Section */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
        
        {/* Toolbar & Tabs */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('alloted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'alloted'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🎯 Alloted to Me ({kpis.allotedCount})
            </button>
            <button
              onClick={() => setActiveTab('dept')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dept'
                  ? 'bg-govblue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🏢 My Dept Queue ({kpis.deptActive})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🌐 All Issues ({kpis.totalAllCount})
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'progress'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ⚡ In Progress ({kpis.inProgressCount})
            </button>
            <button
              onClick={() => setActiveTab('urgent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'urgent'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🚨 Urgent ({kpis.urgentCount})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ✅ Resolved ({kpis.resolvedCount})
            </button>
          </div>

          {/* Search & Department Selector */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, issue, officer..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>

        {/* Complaints Grid */}
        <div className="p-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading issues directory...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Issues Found in this View</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === 'alloted' ? 'No grievances are currently alloted directly to your account.' : 'No cases match the selected filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((complaint) => {
                const isAllotedToMe = (complaint.assigned_to || '').toLowerCase().includes((user?.name || '').toLowerCase());
                return (
                  <div
                    key={complaint.complaint_id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isAllotedToMe
                        ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950 px-2 py-0.5 rounded border border-govblue-200 dark:border-govblue-800">
                          {complaint.complaint_id}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {complaint.status || 'Pending'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                          {complaint.category} Grievance
                        </h4>
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block truncate">
                          🏢 {complaint.assigned_department || 'General Administration'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {complaint.summary || complaint.complaint}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{complaint.location || 'Constituency Location'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-orange-600">{complaint.priority_level} ({complaint.priority_score}/100)</span>
                        <span className="text-slate-400 truncate max-w-[140px]">
                          👤 {complaint.assigned_to || 'Unassigned'}
                        </span>
                      </div>

                      <button
                        onClick={() => openDrawer(complaint)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect & Resolve Case
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </section>

      {/* Action Drawer Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto p-6 sm:p-8 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              
              {/* Drawer Top */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950 px-2.5 py-1 rounded-lg border border-govblue-200 dark:border-govblue-800">
                    {selectedComplaint.complaint_id}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] mt-1">
                    {selectedComplaint.category} Case File
                  </h3>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5">
                    🏢 {selectedComplaint.assigned_department}
                  </span>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  ✕
                </button>
              </div>

              {msg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  ✓ {msg}
                </div>
              )}
              {msgError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold">
                  ⚠ {msgError}
                </div>
              )}

              {/* Grievance Narrative */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Citizen Report Narrative</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedComplaint.complaint || selectedComplaint.transcribed_complaint || selectedComplaint.summary}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>📍 {selectedComplaint.location}</span>
                  <span>Priority: <strong className="text-orange-600">{selectedComplaint.priority_level} ({selectedComplaint.priority_score}/100)</strong></span>
                </div>
              </div>

              {/* Photo Evidence if any */}
              {selectedComplaint.image_path && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Photographic Evidence</span>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <img
                      src={getImageUrl(selectedComplaint.image_path)}
                      alt="Grievance Evidence"
                      className="h-36 w-48 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Photo+Proof'; }}
                    />
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p><strong>AI Vision:</strong> {selectedComplaint.verification_status || 'Verified'}</p>
                      {selectedComplaint.image_summary && <p className="italic">"{selectedComplaint.image_summary}"</p>}
                      <a
                        href={`https://www.google.com/maps?q=${selectedComplaint.latitude || 28.6139},${selectedComplaint.longitude || 77.2090}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-govblue-600 dark:text-govblue-400 font-bold hover:underline inline-block pt-1"
                      >
                        View Site GPS on Maps ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Officer Action Form */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4 text-xs">
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  Officer Action & Resolution Controls
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Officer / Lead
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={assignedToVal}
                        onChange={(e) => setAssignedToVal(e.target.value)}
                        placeholder="Officer name..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setAssignedToVal(`${user?.name} (${user?.designation || user?.department})`)}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shrink-0"
                      >
                        Self Assign
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Case Status
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="Pending">Pending Review</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress (Work Ongoing)</option>
                      <option value="Resolved">Resolved & Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Field Resolution Remarks
                    </label>
                    <textarea
                      rows="3"
                      value={remarksVal}
                      onChange={(e) => setRemarksVal(e.target.value)}
                      placeholder="Describe physical inspection, repair work executed, materials replaced..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium resize-none"
                    />

                    {/* Quick fill remark chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => quickFillRemarks('Site inspected by field team')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        + Site Inspected
                      </button>
                      <button
                        type="button"
                        onClick={() => quickFillRemarks('Repair work executed and verified')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        + Repair Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => quickFillRemarks('Materials replaced & functional')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        + Materials Replaced
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={saving}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                  >
                    Save Status & Notes
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={saving}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                  >
                    Mark as Resolved & Close
                  </button>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={closeDrawer}
                className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
