import React, { useEffect, useMemo, useState } from 'react';

import {
  getComplaints,
  assignComplaint,
  updateComplaintStatus,
  resolveComplaint,
  getDepartmentStaff,
} from '../services/api';

import {
  getSLAStatus,
  getSLAStyles,
} from '../utils/slaUtils';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const cleanPath = imagePath.replace(/\\/g, '/');
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return base ? `${base}${normalized}` : normalized;
};

export default function ComplaintManagement() {

  const [complaints, setComplaints] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllAttentionCases, setShowAllAttentionCases] = useState(false)
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');

  // Selected complaint for View & Manage
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Management form values
  const [assignedTo, setAssignedTo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchComplaints();
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setStaffLoading(true);
      const data = await getDepartmentStaff();
      if (data && data.staff) {
        setStaffMembers(data.staff);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getComplaints();

      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('Error loading complaints:', error);

      setError(
        'Unable to load complaint records. Please check the backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openComplaint = (complaint) => {
    setSelectedComplaint(complaint);

    setAssignedTo(complaint.assigned_to || '');

    setNewStatus(complaint.status || 'Pending');

    setResolutionRemarks(complaint.resolution_remarks || '');
  };

  const closeComplaint = () => {
    setSelectedComplaint(null);
  };

  const refreshComplaintData = async (complaintId) => {
  const data = await getComplaints();

  const updatedComplaints = data.complaints || [];

  setComplaints(updatedComplaints);

  const updatedComplaint = updatedComplaints.find(
    (complaint) => complaint.complaint_id === complaintId
  );

  if (updatedComplaint) {
    setSelectedComplaint(updatedComplaint);

    setAssignedTo(updatedComplaint.assigned_to || '');

    setNewStatus(updatedComplaint.status || 'Pending');

    setResolutionRemarks(
      updatedComplaint.resolution_remarks || ''
    );
  }
};


const handleSaveChanges = async () => {
  if (!selectedComplaint?.complaint_id) {
    setActionError('Complaint ID is not available.');
    return;
  }

  try {
    setSaving(true);
    setActionError('');
    setActionMessage('');

    const complaintId = selectedComplaint.complaint_id;

    /*
      Assign officer if one has been entered
    */
    if (assignedTo.trim()) {
      await assignComplaint(
        complaintId,
        assignedTo.trim()
      );
    }

    /*
      Update complaint status
    */
    if (newStatus) {
      await updateComplaintStatus(
        complaintId,
        newStatus
      );
    }

    await refreshComplaintData(complaintId);

    setActionMessage(
      'Complaint changes have been saved successfully.'
    );

  } catch (error) {
    console.error('Error saving complaint:', error);

    setActionError(
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Unable to save complaint changes.'
    );

  } finally {
    setSaving(false);
  }
};


const handleResolveComplaint = async () => {
  if (!selectedComplaint?.complaint_id) {
    setActionError('Complaint ID is not available.');
    return;
  }

  if (!resolutionRemarks.trim()) {
    setActionError(
      'Please enter resolution remarks before resolving the complaint.'
    );

    return;
  }

  try {
    setSaving(true);
    setActionError('');
    setActionMessage('');

    const complaintId = selectedComplaint.complaint_id;

    /*
      Save officer assignment first if provided
    */
    if (assignedTo.trim()) {
      await assignComplaint(
        complaintId,
        assignedTo.trim()
      );
    }

    /*
      Resolve complaint
    */
    await resolveComplaint(
      complaintId,
      resolutionRemarks.trim()
    );

    await refreshComplaintData(complaintId);

    setNewStatus('Resolved');

    setActionMessage(
      'Complaint has been resolved successfully.'
    );

  } catch (error) {
    console.error('Error resolving complaint:', error);

    setActionError(
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Unable to resolve the complaint.'
    );

  } finally {
    setSaving(false);
  }
};

  const statistics = useMemo(() => {
  const now = new Date();

  return {
    // Total complaints
    total: complaints.length,

    // All complaints that are not resolved
    active: complaints.filter(
      (complaint) => complaint.status !== 'Resolved'
    ).length,

    // High + Critical priority complaints
    highPriority: complaints.filter(
      (complaint) =>
        complaint.priority_level === 'High' ||
        complaint.priority_level === 'Critical'
    ).length,

    // Resolved complaints
    resolved: complaints.filter(
      (complaint) => complaint.status === 'Resolved'
    ).length,

    // Escalated complaints
    escalated: complaints.filter(
      (complaint) =>
        complaint.status === 'Escalated' ||
        complaint.escalated === true
    ).length,

    // SLA deadline has passed and complaint is not resolved
    overdue: complaints.filter((complaint) => {
      if (!complaint.sla_deadline) return false;

      return (
        new Date(complaint.sla_deadline) < now &&
        complaint.status !== 'Resolved'
      );
    }).length,
  };
}, [complaints]);

const getSlaStatus = (complaint) => {
  if (!complaint?.sla_deadline) {
    return 'No SLA'
  }

  const deadline = new Date(complaint.sla_deadline)
  const now = new Date()

  if (Number.isNaN(deadline.getTime())) {
    return 'No SLA'
  }

  if (deadline.getTime() < now.getTime()) {
    return 'Overdue'
  }

  const difference = deadline.getTime() - now.getTime()
  const hoursRemaining = difference / (1000 * 60 * 60)

  if (hoursRemaining <= 24) {
    return 'Due Soon'
  }

  return 'On Track'
}

const getImmediateAttentionComplaints = () => {
  return complaints.filter((complaint) => {
    const status = complaint.status?.toLowerCase()

    // Don't show already resolved complaints
    if (status === 'resolved' || status === 'closed') {
      return false
    }

    const priority = complaint.priority_level?.toLowerCase()
    const slaStatus = getSlaStatus(complaint)

    return (
      complaint.escalated === true ||
      complaint.location_mismatch === true ||
      slaStatus === 'Overdue' ||
      priority === 'high' ||
      priority === 'critical'
    )
  })
}

const immediateAttentionComplaints = getImmediateAttentionComplaints()

  const categoryOptions = useMemo(() => {
    const defaultCategories = [
      'Roads & Bridges',
      'Water Supply',
      'Drainage & Sewage',
      'Sanitation & Waste Management',
      'Electricity & Power',
      'Street Lighting',
      'Public Safety & Law/Order',
      'Healthcare & Hospitals',
      'Education & Schools',
      'Public Transport & Traffic',
      'Environment & Pollution',
      'Parks & Recreation',
      'Housing & Slum Rehabilitation',
      'Revenue & Land Records',
      'Public Distribution System (PDS)',
      'Social Welfare & Pensions',
      'Other'
    ];
    const presentCategories = complaints
      .map((c) => c.category)
      .filter(Boolean);
    const combined = Array.from(new Set([...defaultCategories, ...presentCategories])).sort();
    return ['All Categories', ...combined];
  }, [complaints]);

  const departmentOptions = useMemo(() => {
    const defaultDepts = [
      'Roads & Infrastructure Department',
      'Water Supply Department',
      'Drainage & Sewerage Board',
      'Sanitation & Waste Management Department',
      'Electrical & Power Department',
      'Street Lighting & Electrical Division',
      'Public Safety & Police Administration',
      'Health & Family Welfare Department',
      'Education & School Infrastructure Department',
      'Transport & Traffic Department',
      'Environment & Pollution Control Board',
      'Horticulture & Parks Department',
      'Housing & Urban Development Authority',
      'Revenue & Land Administration',
      'Food & Civil Supplies Department',
      'Social Welfare & Pensions Department',
      'General Administration'
    ];
    const presentDepts = complaints
      .map((c) => c.assigned_department)
      .filter(Boolean);
    const combined = Array.from(new Set([...defaultDepts, ...presentDepts])).sort();
    return ['All Departments', ...combined];
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const search = searchTerm.toLowerCase();

      const complaintId = (
        complaint.complaint_id || ''
      ).toLowerCase();

      const category = (
        complaint.category || ''
      ).toLowerCase();

      const summary = (
        complaint.summary || ''
      ).toLowerCase();

      const location = (
        complaint.location || ''
      ).toLowerCase();

      const department = (
        complaint.assigned_department || ''
      ).toLowerCase();

      const matchesSearch =
        complaintId.includes(search) ||
        category.includes(search) ||
        summary.includes(search) ||
        location.includes(search) ||
        department.includes(search);

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'All Priorities' ||
        complaint.priority_level === priorityFilter;

      const matchesCategory =
        categoryFilter === 'All Categories' ||
        complaint.category === categoryFilter;

      const matchesDepartment =
        departmentFilter === 'All Departments' ||
        complaint.assigned_department === departmentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesDepartment
      );
    });
  }, [
    complaints,
    searchTerm,
    statusFilter,
    priorityFilter,
    categoryFilter,
    departmentFilter,
  ]);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'border-red-300 bg-red-50 text-red-800';

      case 'High':
        return 'border-orange-300 bg-orange-50 text-orange-800';

      case 'Medium':
        return 'border-blue-300 bg-blue-50 text-blue-800';

      default:
        return 'border-green-300 bg-green-50 text-green-800';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Resolved':
        return 'border-green-300 bg-green-50 text-green-800';

      case 'Escalated':
        return 'border-red-300 bg-red-50 text-red-800';

      case 'In Progress':
      case 'Assigned':
        return 'border-blue-300 bg-blue-50 text-blue-800';

      default:
        return 'border-amber-300 bg-amber-50 text-amber-800';
    }
  };

  const formatSla = (slaDeadline) => {
    if (!slaDeadline) {
      return 'Not Assigned';
    }

    const deadline = new Date(slaDeadline);
    const now = new Date();
    const difference = deadline - now;

    if (difference <= 0) {
      return 'Overdue';
    }

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <main className="flex-grow bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="text-sm font-medium text-slate-600">
            Loading complaint records...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full space-y-8 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-govblue-600 animate-pulse"></span>
            <p className="text-xs font-extrabold uppercase tracking-widest text-govblue-600 dark:text-govblue-400">
              Constituency Grievance Cell
            </p>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
            Complaint Case Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Triage, assign officers, monitor SLA deadlines, and resolve citizen grievances with AI visual evidence.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchComplaints}
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 px-4 py-2.5 shadow-sm transition-all"
          >
            Refresh Records
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Filings</span>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">{statistics.total}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Constituency grievances registered</p>
        </div>

        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">Critical & Urgent</span>
          <p className="mt-2 text-3xl font-extrabold text-red-700 dark:text-red-400 font-['Outfit']">{statistics.highPriority}</p>
          <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">Requires immediate attention</p>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Active & In Progress</span>
          <p className="mt-2 text-3xl font-extrabold text-amber-700 dark:text-amber-400 font-['Outfit']">{statistics.active}</p>
          <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">Assigned & ongoing work</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Resolved Cases</span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-['Outfit']">{statistics.resolved}</p>
          <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">Closed & redressal confirmed</p>
        </div>
      </div>

      {/* Immediate Attention Required */}
      {immediateAttentionComplaints.length > 0 && (
        <section className="rounded-3xl border-2 border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/30 overflow-hidden shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 bg-red-100/80 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800">
            <div>
              <h2 className="text-base font-bold text-red-900 dark:text-red-100 font-['Outfit']">
                Immediate Administrative Attention Required
              </h2>
              <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                Critical hazards, escalated cases, or SLA deadlines nearing breach.
              </p>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs shadow-sm">
              {immediateAttentionComplaints.length} Urgent Cases
            </span>
          </div>

          <div className="divide-y divide-red-200 dark:divide-red-900/50">
            {(showAllAttentionCases
              ? immediateAttentionComplaints
              : immediateAttentionComplaints.slice(0, 4)
            ).map((complaint) => {
              const slaStatus = getSlaStatus(complaint);

              return (
                <div
                  key={complaint.complaint_id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors bg-white/60 dark:bg-slate-900/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-extrabold text-govblue-700 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/60 px-2.5 py-0.5 rounded-lg border border-govblue-200 dark:border-govblue-800">
                        {complaint.complaint_id}
                      </span>

                      {complaint.escalated && (
                        <span className="border border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/80 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide text-red-800 dark:text-red-200">
                          Escalated
                        </span>
                      )}

                      {slaStatus === 'Overdue' && (
                        <span className="border border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/80 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide text-red-800 dark:text-red-200">
                          Overdue SLA
                        </span>
                      )}

                      {(complaint.priority_level === 'High' ||
                        complaint.priority_level === 'Critical') && (
                        <span className="border border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-900/80 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide text-orange-800 dark:text-orange-200">
                          {complaint.priority_level} Priority
                        </span>
                      )}

                      {complaint.location_mismatch && (
                        <span className="border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/80 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                          ⚠️ GPS Mismatch ({complaint.location_distance_km ? `${complaint.location_distance_km} km` : 'Off-site'})
                        </span>
                      )}

                      {complaint.image_path && (
                        <span className="border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          📸 Photo Proof
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                      {complaint.category || 'General'} Complaint
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {complaint.summary ||
                        complaint.complaint ||
                        'No complaint description available.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <strong>Department:</strong>{' '}
                        {complaint.assigned_department || 'Not Assigned'}
                      </span>

                      <span>
                        <strong>Status:</strong>{' '}
                        {complaint.status || 'Pending'}
                      </span>

                      <span>
                        <strong>SLA:</strong> {slaStatus}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openComplaint(complaint)}
                    className="shrink-0 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
                  >
                    Review Case File →
                  </button>
                </div>
              );
            })}
          </div>

          {immediateAttentionComplaints.length > 4 && (
            <div className="flex flex-col gap-3 border-t border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Showing{' '}
                {showAllAttentionCases
                  ? immediateAttentionComplaints.length
                  : 4}{' '}
                of {immediateAttentionComplaints.length} urgent complaints.
              </p>

              <button
                onClick={() =>
                  setShowAllAttentionCases(!showAllAttentionCases)
                }
                className="text-xs font-bold text-red-700 dark:text-red-300 hover:underline"
              >
                {showAllAttentionCases
                  ? 'Show Fewer Urgent Cases'
                  : `View All ${immediateAttentionComplaints.length} Urgent Cases`}
              </button>
            </div>
          )}
        </section>
      )}


        {/* Error */}
        {error && (
          <div className="mt-6 border border-red-300 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={fetchComplaints}
              className="mt-3 border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Try Again
            </button>

          </div>
        )}

        {!error && (
          <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Search & Filters Toolbar */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Complaint No (e.g. CMP-...), keyword, category, or department..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-govblue-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-44">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500"
                  >
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Escalated</option>
                    <option>Resolved</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="w-full sm:w-44">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500"
                  >
                    <option>All Priorities</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="w-full sm:w-52">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 truncate"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Filter */}
                <div className="w-full sm:w-56">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-govblue-500 truncate"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Complaints Grid */}
            <div className="p-6">
              {filteredComplaints.length === 0 ? (
                <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">No Complaints Found</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search terms or filter selections.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredComplaints.map((complaint, index) => {
                    const sla = getSLAStatus(complaint.sla_deadline, complaint.status);
                    const slaStyles = getSLAStyles(sla.type);

                    return (
                      <div
                        key={complaint.complaint_id || index}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm hover:shadow-md hover:border-govblue-300 dark:hover:border-govblue-700 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top Row */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-xs font-extrabold text-govblue-700 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/60 px-2.5 py-1 rounded-lg border border-govblue-200 dark:border-govblue-800">
                              {complaint.complaint_id || 'CMP-RECORD'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase ${
                                  complaint.priority_level === 'Critical'
                                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    : complaint.priority_level === 'High'
                                    ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {complaint.priority_level || 'Low'}
                              </span>

                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase ${
                                  complaint.status === 'Resolved'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : complaint.status === 'In Progress'
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {complaint.status || 'Pending'}
                              </span>
                            </div>
                          </div>

                          {/* Complaint Category & Narrative */}
                          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                            {complaint.category || 'General'} Complaint
                          </h3>

                          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {complaint.summary || complaint.complaint || 'No grievance description available.'}
                          </p>

                          {/* Photo Badge & Location Info */}
                          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                            {complaint.image_path && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-govblue-50 dark:bg-govblue-950/60 text-govblue-700 dark:text-govblue-300 font-bold border border-govblue-200 dark:border-govblue-800 text-[11px]">
                                📸 Photo Attached
                              </span>
                            )}
                            {complaint.location_mismatch && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                                ⚠️ GPS Mismatch ({complaint.location_distance_km ? `${complaint.location_distance_km} km` : 'Discrepancy'})
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                              📍 {complaint.location || 'Constituency'}
                            </span>
                            {complaint.assigned_department && (
                              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                                🏛 {complaint.assigned_department}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: SLA & Action Button */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                          <div className="text-[11px]">
                            <span className="text-slate-400 block">SLA Status:</span>
                            <span className={`font-bold ${sla.type === 'breached' ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                              {sla.remaining || 'Standard SLA'}
                            </span>
                          </div>

                          <button
                            onClick={() => openComplaint(complaint)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold text-xs shadow-sm transition-all"
                          >
                            Manage Case →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

      {/* Complaint Management Panel Drawer */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
            {/* Panel Header */}
            <div>
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-govblue-600 dark:text-govblue-400">
                    Grievance Case File
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
                      {selectedComplaint.complaint_id || 'Legacy Record'}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={closeComplaint}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Location Discrepancy Alert Banner */}
                {selectedComplaint.location_mismatch && (
                  <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">⚠️</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 font-['Outfit']">
                            Location Discrepancy Alert: Photo GPS & Submitted Place Mismatch
                          </h4>
                          {selectedComplaint.location_distance_km && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200 font-bold text-xs border border-red-200 dark:border-red-700">
                              {selectedComplaint.location_distance_km} km difference
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-1.5 leading-relaxed">
                          {selectedComplaint.location_mismatch_reason ||
                            `The embedded image EXIF GPS coordinates do not match the place coordinates provided during grievance submission.`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          {selectedComplaint.exif_coordinates && (
                            <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800">
                              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Image EXIF GPS</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {selectedComplaint.exif_coordinates.latitude?.toFixed(4)}° N, {selectedComplaint.exif_coordinates.longitude?.toFixed(4)}° E
                              </span>
                            </div>
                          )}
                          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800">
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Submitted Place Location</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {selectedComplaint.submitted_coordinates?.latitude?.toFixed(4) || selectedComplaint.latitude?.toFixed(4)}° N, {selectedComplaint.submitted_coordinates?.longitude?.toFixed(4) || selectedComplaint.longitude?.toFixed(4)}° E
                            </span>
                          </div>
                        </div>
                        <p className="mt-2.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          💡 <em>Administrative note: Please verify if the photo was taken off-site or if the citizen submitted from a remote location.</em>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Complaint Details */}
                <PanelSection title="Complaint Details">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoItem
                      label="Category"
                      value={selectedComplaint.category || 'Not Available'}
                    />
                    <InfoItem
                      label="Urgency"
                      value={selectedComplaint.urgency || 'Not Available'}
                    />
                    <InfoItem
                      label="Priority Level"
                      value={selectedComplaint.priority_level || 'Low'}
                    />
                    <InfoItem
                      label="Priority Score"
                      value={`${selectedComplaint.priority_score ?? 'N/A'}/100`}
                    />
                    <InfoItem
                      label="Department"
                      value={selectedComplaint.assigned_department || 'Not Assigned'}
                    />
                    <InfoItem
                      label="SLA Status"
                      value={formatSla(selectedComplaint.sla_deadline)}
                    />
                  </div>
                </PanelSection>

                {/* AI Analysis */}
                <PanelSection title="AI Diagnostics & Impact">
                  <InfoItem
                    label="Summary"
                    value={
                      selectedComplaint.summary ||
                      selectedComplaint.complaint ||
                      'No summary available.'
                    }
                  />

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoItem
                      label="Similar Grievances Clustered"
                      value={selectedComplaint.similar_count ?? 0}
                    />
                    <InfoItem
                      label="Estimated Beneficiaries"
                      value={selectedComplaint.beneficiaries || 'Not Available'}
                    />
                  </div>
                </PanelSection>

                {/* Photographic Evidence & Geo-tag */}
                <PanelSection title="Attached Photographic Evidence">
                  {selectedComplaint.image_path ? (
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-950 group">
                        <img
                          src={getImageUrl(selectedComplaint.image_path)}
                          alt="Complaint Evidence"
                          className="w-full max-h-80 object-contain mx-auto"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/600x400?text=Image+Unavailable';
                          }}
                        />
                        <a
                          href={getImageUrl(selectedComplaint.image_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg transition-all border border-slate-700 inline-flex items-center gap-1"
                        >
                          View Full Image ↗
                        </a>
                      </div>

                      {/* GPS Geo-Tag Map Pin */}
                      <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs gap-2">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <span className="font-bold">📍 GPS Coordinates:</span>
                          <span className="font-mono">{selectedComplaint.latitude || '28.6139'}° N, {selectedComplaint.longitude || '77.2090'}° E</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${selectedComplaint.latitude || 28.6139},${selectedComplaint.longitude || 77.2090}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-govblue-600 dark:text-govblue-400 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Open in Google Maps ↗
                        </a>
                      </div>

                      {/* AI Visual Verification Details */}
                      {(selectedComplaint.verification_status || selectedComplaint.detected_category) && (
                        <div className="p-3.5 rounded-xl border border-govblue-200 dark:border-govblue-800 bg-govblue-50/50 dark:bg-govblue-950/30 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-govblue-900 dark:text-govblue-200">Gemini Visual AI Verification:</span>
                            <span className="font-bold px-2 py-0.5 rounded bg-govblue-100 dark:bg-govblue-900 text-govblue-800 dark:text-govblue-200">
                              {selectedComplaint.verification_status || 'Verified Visual Proof'}
                            </span>
                          </div>
                          {selectedComplaint.detected_category && (
                            <p className="text-slate-600 dark:text-slate-300">
                              <strong>Visual Detection:</strong> {selectedComplaint.detected_category} ({selectedComplaint.detected_severity || 'High'} Severity)
                            </p>
                          )}
                          {selectedComplaint.image_summary && (
                            <p className="text-slate-600 dark:text-slate-300 italic">
                              "{selectedComplaint.image_summary}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
                      No photographic evidence attached for this grievance (Voice or Text-only filing).
                    </div>
                  )}
                </PanelSection>

                {/* Original Complaint */}
                <PanelSection title="Citizen Grievance Narrative">
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
                    {selectedComplaint.complaint ||
                      selectedComplaint.transcribed_complaint ||
                      selectedComplaint.summary ||
                      'Original complaint text is not available.'}
                  </p>
                </PanelSection>

                {/* Case Management Form */}
                <PanelSection title="Case Redressal Management">
                  {actionMessage && (
                    <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      ✓ {actionMessage}
                    </div>
                  )}

                  {actionError && (
                    <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/60 p-3 text-xs font-bold text-red-800 dark:text-red-300">
                      ⚠ {actionError}
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    
                    {/* Department Staff Directory & Smart Assignment */}
                    <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <span>🏢 Department Staff Accounts ({selectedComplaint.assigned_department || 'General Administration'})</span>
                        </label>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                          {staffMembers.filter(s => s.department?.toLowerCase() === (selectedComplaint.assigned_department || '').toLowerCase()).length} Officers Available
                        </span>
                      </div>

                      {/* Matched Department Staff Cards */}
                      {staffMembers.filter(s => s.department?.toLowerCase() === (selectedComplaint.assigned_department || '').toLowerCase()).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {staffMembers
                            .filter(s => s.department?.toLowerCase() === (selectedComplaint.assigned_department || '').toLowerCase())
                            .map((staff, sIdx) => {
                              const isAssigned = assignedTo.includes(staff.name);
                              return (
                                <div
                                  key={sIdx}
                                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                                    isAssigned
                                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-sm'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-900 dark:text-white text-xs">{staff.name}</span>
                                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                                        {staff.role}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{staff.designation || 'Department Officer'}</p>
                                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate">{staff.email}</p>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    {isAssigned ? (
                                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                        ✓ Assigned Officer
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAssignedTo(`${staff.name} (${staff.designation || staff.department})`);
                                          if (newStatus === 'Pending') setNewStatus('Assigned');
                                        }}
                                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700"
                                      >
                                        + Assign This Officer
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                          <p>No staff accounts registered under <strong>{selectedComplaint.assigned_department}</strong> yet.</p>
                          <p className="text-[11px] text-slate-400">You can pick from other officers below or enter a custom officer name.</p>
                        </div>
                      )}

                      {/* Quick Dropdown Picker */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Select from Registered Officers (All Departments):
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setAssignedTo(e.target.value);
                              if (newStatus === 'Pending') setNewStatus('Assigned');
                            }
                          }}
                          value={assignedTo}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Choose an Officer from Directory --</option>
                          <optgroup label={`Department Officers (${selectedComplaint.assigned_department || 'Current Department'})`}>
                            {staffMembers
                              .filter(s => s.department?.toLowerCase() === (selectedComplaint.assigned_department || '').toLowerCase())
                              .map((s, idx) => (
                                <option key={`match-${idx}`} value={`${s.name} (${s.designation || s.department})`}>
                                  {s.name} - {s.designation || s.department} ({s.email})
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Other Department Officers">
                            {staffMembers
                              .filter(s => s.department?.toLowerCase() !== (selectedComplaint.assigned_department || '').toLowerCase())
                              .map((s, idx) => (
                                <option key={`other-${idx}`} value={`${s.name} (${s.designation || s.department})`}>
                                  {s.name} - {s.department} ({s.email})
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* Manual Assignee Override */}
                    <div>
                      <label className="mb-1.5 block font-bold text-slate-700 dark:text-slate-300">
                        Assigned Officer / Team Name
                      </label>
                      <input
                        type="text"
                        value={assignedTo}
                        onChange={(event) => setAssignedTo(event.target.value)}
                        placeholder="Enter officer, engineer or field squad name..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-govblue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block font-bold text-slate-700 dark:text-slate-300">
                        Current Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(event) => setNewStatus(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-govblue-500"
                      >
                        <option value="Pending">Pending Review</option>
                        <option value="Assigned">Assigned to Officer</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Escalated">Escalated to MP Office</option>
                        <option value="Resolved">Resolved & Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-bold text-slate-700 dark:text-slate-300">
                        Resolution Remarks & Work Notes
                      </label>
                      <textarea
                        value={resolutionRemarks}
                        onChange={(event) => setResolutionRemarks(event.target.value)}
                        rows="4"
                        placeholder="Record work orders issued, inspection findings, or closure confirmation..."
                        className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-govblue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="rounded-xl bg-govblue-600 hover:bg-govblue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Case Changes'}
                    </button>
                    <button
                      onClick={handleResolveComplaint}
                      disabled={saving}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                    >
                      {saving ? 'Processing...' : 'Mark as Resolved'}
                    </button>
                  </div>
                </PanelSection>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
              <button
                onClick={closeComplaint}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* Reusable Components */

function StatCard({ title, value, border = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm ${border}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
        {value}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function PanelSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-5 py-3.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white font-['Outfit']">
          {title}
        </h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </section>
  );
}