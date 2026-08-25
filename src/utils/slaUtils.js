export const getSLAStatus = (deadline, complaintStatus) => {
  if (!deadline) {
    return {
      label: 'SLA Not Available',
      type: 'unavailable',
      remaining: null,
    };
  }

  if (complaintStatus === 'Resolved') {
    return {
      label: 'Resolved',
      type: 'resolved',
      remaining: null,
    };
  }

  const now = new Date();
  const slaDeadline = new Date(deadline);

  const difference = slaDeadline - now;

  const hoursRemaining = Math.floor(
    difference / (1000 * 60 * 60)
  );

  if (difference <= 0) {
    const hoursExpired = Math.abs(hoursRemaining);

    return {
      label: 'SLA Breached',
      type: 'breached',
      remaining: `${hoursExpired} hours overdue`,
    };
  }

  if (hoursRemaining < 24) {
    return {
      label: 'Expiring Soon',
      type: 'warning',
      remaining: `${hoursRemaining} hours remaining`,
    };
  }

  const daysRemaining = Math.floor(hoursRemaining / 24);

  return {
    label: 'Within SLA',
    type: 'safe',
    remaining: `${daysRemaining} days remaining`,
  };
};


export const getSLAStyles = (type) => {
  const styles = {
    safe: {
      badge:
        'border border-green-300 bg-green-50 text-green-800',
      text: 'text-green-700',
    },

    warning: {
      badge:
        'border border-amber-300 bg-amber-50 text-amber-800',
      text: 'text-amber-700',
    },

    breached: {
      badge:
        'border border-red-300 bg-red-50 text-red-800',
      text: 'text-red-700',
    },

    resolved: {
      badge:
        'border border-slate-300 bg-slate-100 text-slate-700',
      text: 'text-slate-600',
    },

    unavailable: {
      badge:
        'border border-slate-300 bg-slate-50 text-slate-600',
      text: 'text-slate-500',
    },
  };

  return styles[type] || styles.unavailable;
};