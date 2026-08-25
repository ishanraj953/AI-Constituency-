import React, { useEffect, useMemo, useState } from 'react';

import {
  getComplaints,
  assignComplaint,
  updateComplaintStatus,
  resolveComplaint,
} from '../services/api';

import {
  getSLAStatus,
  getSLAStyles,
} from '../utils/slaUtils';

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllAttentionCases, setShowAllAttentionCases] = useState(false)
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');

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
  }, []);

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
      slaStatus === 'Overdue' ||
      priority === 'high' ||
      priority === 'critical'
    )
  })
}

const immediateAttentionComplaints = getImmediateAttentionComplaints()

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

      const matchesSearch =
        complaintId.includes(search) ||
        category.includes(search) ||
        summary.includes(search) ||
        location.includes(search);

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'All Priorities' ||
        complaint.priority_level === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    complaints,
    searchTerm,
    statusFilter,
    priorityFilter,
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
    <main className="flex-grow bg-slate-50">

      {/* Page Header */}
      <section className="border-b border-slate-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <p className="text-xs font-semibold uppercase tracking-wider text-govblue-700">
            Representative Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Complaint Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review, assign, monitor and resolve citizen grievances submitted
            within the constituency.
          </p>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <StatCard
          title="Total Complaints"
          value={statistics.total}
          />

          <StatCard
            title="Active Complaints"
            value={statistics.active}
            border="border-l-blue-600"
          />

          <StatCard
            title="High Priority"
            value={statistics.highPriority}
            border="border-l-orange-500"
          />


          <StatCard
            title="Escalated"
            value={statistics.escalated}
            border="border-l-red-700"
          />

          <StatCard
            title="Overdue Cases"
            value={statistics.overdue}
            border="border-l-red-500"
          />

          <StatCard
            title="Resolved"
            value={statistics.resolved}
            border="border-l-green-600"
          />

        </div>


        {/* Immediate Attention Required */}
      {immediateAttentionComplaints.length > 0 && (
  <section className="m-8 border border-red-200 bg-red-50">
    
    <div className="flex flex-col gap-3 border-b border-red-200 bg-red-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-red-900">
          Immediate Attention Required
        </h2>

        <p className="mt-1 text-sm text-red-700">
          These complaints require immediate administrative attention.
        </p>
      </div>

      <span className="inline-flex w-fit items-center border border-red-300 bg-white px-3 py-1 text-sm font-bold text-red-700">
        {immediateAttentionComplaints.length} Cases
      </span>
    </div>

    <div className="divide-y divide-red-200">
      {(showAllAttentionCases
          ? immediateAttentionComplaints
          : immediateAttentionComplaints.slice(0, 5)
        ).map((complaint) => {
        const slaStatus = getSlaStatus(complaint)

        return (
          <div
            key={complaint.complaint_id}
            className="flex flex-col gap-4 bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="min-w-0 flex-1">
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-govblue-800">
                  {complaint.complaint_id}
                </span>

                {complaint.escalated && (
                  <span className="border border-red-300 bg-red-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                    Escalated
                  </span>
                )}

                {slaStatus === 'Overdue' && (
                  <span className="border border-red-300 bg-red-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                    Overdue
                  </span>
                )}

                {(complaint.priority_level === 'High' ||
                  complaint.priority_level === 'Critical') && (
                  <span className="border border-orange-300 bg-orange-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                    {complaint.priority_level} Priority
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-900">
                {complaint.category || 'General'} Complaint
              </h3>

              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {complaint.summary ||
                  complaint.complaint ||
                  'No complaint description available.'}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
                <span>
                  <strong>Department:</strong>{' '}
                  {complaint.assigned_department || 'Not Assigned'}
                </span>

                <span>
                  <strong>Status:</strong>{' '}
                  {complaint.status || 'Pending'}
                </span>

                <span>
                  <strong>SLA:</strong>{' '}
                  {slaStatus}
                </span>
              </div>
            </div>

            <button
              onClick={() => openComplaint(complaint)}
              className="shrink-0 border border-govblue-700 bg-govblue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-govblue-800"
            >
              Review Case
            </button>
          </div>
        )
      })}
    </div>

    {immediateAttentionComplaints.length > 5 && (
  <div className="flex flex-col gap-3 border-t border-red-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
    
    <p className="text-sm text-slate-600">
      Showing{' '}
      {showAllAttentionCases
        ? immediateAttentionComplaints.length
        : 5}{' '}
      of {immediateAttentionComplaints.length} complaints requiring
      immediate attention.
    </p>

    <button
      onClick={() =>
        setShowAllAttentionCases(!showAllAttentionCases)
      }
      className="border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
    >
      {showAllAttentionCases
                ? 'Show Less'
                : `View All ${immediateAttentionComplaints.length} Cases`}
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
          <section className="mt-10 border border-slate-300 bg-white">

            {/* Section Header */}
            <div className="border-b border-slate-300 px-6 py-5">

              <h2 className="text-lg font-bold text-slate-900">
                Complaint Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredComplaints.length} of {complaints.length} complaints.
              </p>

            </div>

            {/* Filters */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                <div className="md:col-span-2">

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Search Complaint
                  </label>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search by Complaint ID, category, location or keyword"
                    className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-govblue-600"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Escalated</option>
                    <option>Resolved</option>
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Priority
                  </label>

                  <select
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(event.target.value)
                    }
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option>All Priorities</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>

                </div>

              </div>

            </div>

            {/* Complaint List */}
            <div className="space-y-4 p-6">

  {filteredComplaints.length === 0 ? (

    <div className="border border-slate-200 py-12 text-center">
      <p className="text-sm font-medium text-slate-600">
        No complaints found matching your filters.
      </p>
    </div>

  ) : (

    filteredComplaints.map((complaint, index) => {

      const sla = getSLAStatus(
        complaint.sla_deadline,
        complaint.status
      );

      const slaStyles = getSLAStyles(sla.type);

      return (

        <article
          key={complaint.complaint_id || index}
          className="border border-slate-300 bg-white"
        >

          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex-1">

              {/* Complaint ID + Status Badges */}
              <div className="flex flex-wrap items-center gap-3">

                {/* Complaint ID */}
                <span className="font-mono text-sm font-semibold text-govblue-800">
                  {complaint.complaint_id || 'Legacy Record'}
                </span>

                {/* Priority */}
                <span
                  className={`border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${getPriorityClass(
                    complaint.priority_level
                  )}`}
                >
                  {complaint.priority_level || 'Low'} Priority
                </span>

                {/* Complaint Status */}
                <span
                  className={`border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${getStatusClass(
                    complaint.status
                  )}`}
                >
                  {complaint.status || 'Pending'}
                </span>

                {/* SLA Status */}
                <span
                  className={`border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${slaStyles.badge}`}
                >
                  {sla.label}
                </span>

              </div>

              {/* Complaint Category */}
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {complaint.category || 'General'} Complaint
              </h3>

              {/* Complaint Summary */}
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {complaint.summary ||
                  complaint.complaint ||
                  'No complaint summary available.'}
              </p>

              {/* Complaint Details */}
              <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                <InfoItem
                  label="Location"
                  value={complaint.location || 'Not Available'}
                />

                <InfoItem
                  label="Department"
                  value={
                    complaint.assigned_department ||
                    'Not Assigned'
                  }
                />

                <InfoItem
                  label="Assigned To"
                  value={
                    complaint.assigned_to ||
                    'Not Assigned'
                  }
                />

                {/* SLA Remaining Time */}
                <InfoItem
                  label="SLA Status"
                  value={
                    sla.remaining
                      ? sla.remaining
                      : formatSla(complaint.sla_deadline)
                  }
                />

              </dl>

            </div>

            {/* View & Manage Button */}
            <button
              onClick={() => openComplaint(complaint)}
              className="shrink-0 border border-govblue-700 bg-govblue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-govblue-800"
            >
              View & Manage
            </button>

          </div>

        </article>

      );

    })

  )}

</div>

          </section>
        )}

      </section>

      {/* Complaint Management Panel */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40">

          <div className="h-full w-full max-w-2xl overflow-y-auto bg-slate-50 shadow-2xl">

            {/* Panel Header */}
            <div className="sticky top-0 z-10 border-b border-slate-300 bg-white px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-govblue-700">
                    Complaint Case File
                  </p>

                  <h2 className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {selectedComplaint.complaint_id || 'Legacy Record'}
                  </h2>

                </div>

                <button
                  onClick={closeComplaint}
                  className="border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>

              </div>

            </div>

            <div className="space-y-8 p-6">

              {/* Complaint Details */}
              <PanelSection title="Complaint Details">

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

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
                    value={selectedComplaint.priority_score ?? 'Not Available'}
                  />

                  <InfoItem
                    label="Department"
                    value={
                      selectedComplaint.assigned_department ||
                      'Not Assigned'
                    }
                  />

                  <InfoItem
                    label="SLA Status"
                    value={formatSla(selectedComplaint.sla_deadline)}
                  />

                </div>

              </PanelSection>

              {/* AI Analysis */}
              <PanelSection title="AI Analysis">

                <InfoItem
                  label="Summary"
                  value={
                    selectedComplaint.summary ||
                    selectedComplaint.complaint ||
                    'No summary available.'
                  }
                />

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <InfoItem
                    label="Similar Complaints"
                    value={selectedComplaint.similar_count ?? 0}
                  />

                  <InfoItem
                    label="Beneficiaries"
                    value={
                      selectedComplaint.beneficiaries ||
                      'Not Available'
                    }
                  />

                </div>

              </PanelSection>

              {/* Original Complaint */}
              <PanelSection title="Citizen Complaint">

                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {selectedComplaint.complaint ||
                    selectedComplaint.transcribed_complaint ||
                    selectedComplaint.summary ||
                    'Original complaint text is not available.'}
                </p>

              </PanelSection>

              {selectedComplaint &&
  (() => {
    const sla = getSLAStatus(
      selectedComplaint.sla_deadline,
      selectedComplaint.status
    );

    const isEscalated =
      selectedComplaint.status === 'Escalated';

    const isBreached =
      sla.type === 'breached';

    if (!isEscalated && !isBreached) return null;

    return (
      <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-red-300 bg-white text-lg font-bold text-red-700">
            !
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-800">
              {isEscalated
                ? 'Complaint Escalated'
                : 'SLA Deadline Breached'}
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {isEscalated
                ? 'This complaint has been escalated and requires immediate attention.'
                : 'The SLA deadline for this complaint has been breached. Immediate action is required to prevent further escalation.'}
            </p>

            {selectedComplaint.sla_deadline && (
              <p className="mt-2 text-xs font-semibold text-red-800">
                SLA Deadline:{' '}
                {formatSla(selectedComplaint.sla_deadline)}
              </p>
            )}

            {sla.remaining && (
              <p className="mt-1 text-xs font-semibold text-red-800">
                Current SLA Status: {sla.remaining}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  })()}

              {/* Case Management */}
              <PanelSection title="Case Management">
                    {actionMessage && (
                        <div className="mb-5 border border-green-300 bg-green-50 px-4 py-3">
                        <p className="text-sm font-medium text-green-800">
                            {actionMessage}
                        </p>
                        </div>
                    )}

                    {actionError && (
                        <div className="mb-5 border border-red-300 bg-red-50 px-4 py-3">
                        <p className="text-sm font-medium text-red-800">
                            {actionError}
                        </p>
                        </div>
                    )}

                <div className="space-y-5">

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Assign Officer
                    </label>

                    <input
                      type="text"
                      value={assignedTo}
                      onChange={(event) =>
                        setAssignedTo(event.target.value)
                      }
                      placeholder="Enter officer name"
                      className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-govblue-600"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Current Status
                    </label>

                    <select
                      value={newStatus}
                      onChange={(event) =>
                        setNewStatus(event.target.value)
                      }
                      className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-govblue-600"
                    >
                      <option>Pending</option>
                      <option>Assigned</option>
                      <option>In Progress</option>
                      <option>Escalated</option>
                      <option>Resolved</option>
                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Resolution Remarks
                    </label>

                    <textarea
                      value={resolutionRemarks}
                      onChange={(event) =>
                        setResolutionRemarks(event.target.value)
                      }
                      rows="5"
                      placeholder="Enter resolution details or official remarks..."
                      className="w-full resize-none border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-govblue-600"
                    />

                  </div>

                </div>

              </PanelSection>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-300 pt-6 sm:flex-row sm:justify-end">

                <button
                    onClick={closeComplaint}
                    disabled={saving}
                    className="border border-slate-400 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="border border-govblue-700 bg-govblue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-govblue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                    onClick={handleResolveComplaint}
                    disabled={saving}
                    className="border border-green-700 bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? 'Processing...' : 'Mark as Resolved'}
                </button>

                </div>

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
    <div
      className={`border border-slate-200 bg-white p-5 shadow-sm border-l-4 ${border}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}


function InfoItem({ label, value }) {
  return (
    <div>

      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium leading-6 text-slate-800">
        {value}
      </dd>

    </div>
  );
}


function PanelSection({ title, children }) {
  return (
    <section className="border border-slate-300 bg-white">

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">

        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
          {title}
        </h3>

      </div>

      <div className="p-5">

        {children}

      </div>

    </section>
  );
}