import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackComplaint } from '../services/api';

export default function CitizenTracking() {
  const navigate = useNavigate();
  const [complaintId, setComplaintId] = useState('');

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


const handleTrackComplaint = async (e) => {
  if (e) {
    e.preventDefault()
  }

  if (!complaintId.trim()) {
    setError('Please enter a Complaint ID')
    return
  }

  try {
    setLoading(true)
    setError('')
    setComplaint(null)

    const data = await trackComplaint(complaintId)

    setComplaint(data)
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Complaint not found'

    setError(message)
  } finally {
    setLoading(false)
  }
}

  const formatDate = (timestamp) => {
  if (!timestamp) return "Time unavailable";

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-700';

      case 'medium':
        return 'border-amber-200 bg-amber-50 text-amber-700';

      default:
        return 'border-green-200 bg-green-50 text-green-700';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'border-green-200 bg-green-50 text-green-700';

      case 'in progress':
        return 'border-blue-200 bg-blue-50 text-blue-700';

      case 'assigned':
        return 'border-purple-200 bg-purple-50 text-purple-700';

      case 'escalated':
        return 'border-red-200 bg-red-50 text-red-700';

      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
  };

  const getTimelineSteps = () => {
    if (!complaint) return [];

    const status = complaint.status?.toLowerCase();

    return [
      {
        label: 'Complaint Submitted',
        completed: true,
      },
      {
        label: 'AI Processing Completed',
        completed: true,
      },
      {
        label: 'Department Assigned',
        completed: Boolean(complaint.assigned_department),
      },
      {
        label: 'Work In Progress',
        completed:
          status === 'in progress' || status === 'resolved',
        active: status === 'in progress',
      },
      {
        label: 'Resolved',
        completed: status === 'resolved',
        active: status === 'resolved',
      },
    ];
  };

  const timelineSteps = getTimelineSteps();

  

  return (
    <div className="flex-grow transition-colors">
      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-govblue-50 dark:bg-govblue-950/70 text-govblue-700 dark:text-govblue-300 border border-govblue-200 dark:border-govblue-800 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 3.75H19.5a.75.75 0 01.75.75v15a.75.75 0 01-.75.75H8.25m0-16.5v16.5m0-16.5H4.5a.75.75 0 00-.75.75v15a.75.75 0 00.75.75h3.75m3.75-12h3m-3 3h3m-3 3h2.25"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl font-['Outfit']">
              Track Your Grievance
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Enter your Complaint ID to check real-time status, assigned officer, SLA deadlines, and resolution progress.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleTrackComplaint}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
              placeholder="Enter Complaint ID (e.g. CMP-E6BD710E)"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none transition focus:border-govblue-600 focus:ring-2 focus:ring-govblue-100 dark:focus:ring-govblue-900"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-govblue-700 bg-govblue-700 hover:bg-govblue-800 px-6 py-3 text-sm font-bold text-white transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Tracking...' : 'Track Complaint'}
            </button>
          </form>

          {error && (
            <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Complaint Details */}
      {complaint && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-extrabold text-govblue-700 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/60 px-3 py-1 rounded-lg border border-govblue-200 dark:border-govblue-800">
                    {complaint.complaint_id}
                  </span>

                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${getPriorityClass(
                      complaint.priority_level
                    )}`}
                  >
                    {complaint.priority_level || 'Low'} Priority
                  </span>

                  <span
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${getStatusClass(
                      complaint.status
                    )}`}
                  >
                    {complaint.status || 'Pending'}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  {complaint.category || 'General'} Complaint
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {complaint.summary ||
                    complaint.complaint ||
                    'No complaint description available.'}
                </p>
              </div>

              {complaint.escalated && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
                  ⚠ This complaint has been escalated for priority handling.
                </div>
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
              Complaint Lifecycle Progression
            </h3>

            <div className="mt-8">
              {timelineSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  {index !== timelineSteps.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-8 h-full w-px ${
                        step.completed
                          ? 'bg-govblue-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}

                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                      step.completed
                        ? 'border-govblue-600 bg-govblue-600 text-white shadow-sm'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {step.completed ? '✓' : index + 1}
                  </div>

                  <div className="pt-1">
                    <p
                      className={`text-sm font-semibold ${
                        step.completed
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.label}
                    </p>

                    {step.active && (
                      <p className="mt-1 text-xs font-semibold text-govblue-600 dark:text-govblue-400">
                        Current active stage
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                Grievance Particulars
              </h3>

              <dl className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
                <DetailItem
                  label="Complaint ID"
                  value={complaint.complaint_id}
                />

                <DetailItem
                  label="Category"
                  value={complaint.category || 'Not Available'}
                />

                <DetailItem
                  label="Priority"
                  value={complaint.priority_level || 'Not Available'}
                />

                <DetailItem
                  label="Location"
                  value={complaint.location || 'Not Available'}
                />

                <DetailItem
                  label="Submitted On"
                  value={formatDate(complaint.created_at)}
                />
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                Handling & Assignment
              </h3>

              <dl className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
                <DetailItem
                  label="Current Status"
                  value={complaint.status || 'Pending'}
                />

                <DetailItem
                  label="Assigned Department"
                  value={
                    complaint.assigned_department || 'Not Assigned Yet'
                  }
                />

                <DetailItem
                  label="Assigned Officer"
                  value={complaint.assigned_to || 'Not Assigned Yet'}
                />

                <DetailItem
                  label="SLA Deadline"
                  value={formatDate(complaint.sla_deadline)}
                />

                <DetailItem
                  label="Escalation Status"
                  value={
                    complaint.escalated
                      ? 'Escalated'
                      : 'No Escalation'
                  }
                />
              </dl>
            </div>
          </div>

          {/* Resolution Remarks */}
          <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
              Resolution Remarks
            </h3>

            <p className="mt-4 border-l-4 border-govblue-600 bg-slate-50 dark:bg-slate-800/60 p-4 text-sm leading-6 text-slate-700 dark:text-slate-300 rounded-r-xl">
              {complaint.resolution_remarks ||
                'No resolution remarks have been added yet.'}
            </p>
          </div>

          {complaint.activity_log &&
            complaint.activity_log.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Activity Audit Trail
                </h3>

                <div className="mt-6 space-y-4">
                  {complaint.activity_log.map((activity, index) => (
                    <div
                      key={`${activity.timestamp}-${index}`}
                      className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0"
                    >
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-govblue-600" />

                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {activity.action}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/user/submit')}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Submit Another Grievance
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">
        {value}
      </dd>
    </div>
  );
}