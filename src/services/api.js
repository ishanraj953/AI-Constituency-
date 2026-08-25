import axios from 'axios';

const base = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: base ? base : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


/**
 * Check backend API status
 * GET /
 */
export const getBackendStatus = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching backend status:', error);
    throw error;
  }
};


/**
 * Submit a citizen complaint
 * POST /complaints
 *
 * Body:
 * {
 *   complaint,
 *   location
 * }
 */
export const submitComplaint = async (complaint, location) => {
  try {
    const response = await api.post('/complaints', {
      complaint,
      location,
    });

    return response.data;
  } catch (error) {
    console.error('Error submitting complaint:', error);
    throw error;
  }
};


/**
 * Fetch all complaints
 * GET /complaints
 */
export const getComplaints = async () => {
  try {
    const response = await api.get('/complaints');
    return response.data;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};


/**
 * Assign a complaint to an officer
 * PATCH /complaints/{complaint_id}/assign
 *
 * Body:
 * {
 *   assigned_to
 * }
 */
export const assignComplaint = async (
  complaintId,
  assignedTo
) => {
  try {
    const response = await api.patch(
      `/complaints/${complaintId}/assign`,
      {
        assigned_to: assignedTo,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error assigning complaint:', error);
    throw error;
  }
};


/**
 * Update complaint status
 * PATCH /complaints/{complaint_id}/status
 *
 * Body:
 * {
 *   status
 * }
 */
export const updateComplaintStatus = async (
  complaintId,
  status
) => {
  try {
    const response = await api.patch(
      `/complaints/${complaintId}/status`,
      {
        status,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};


/**
 * Resolve a complaint
 * PATCH /complaints/{complaint_id}/resolve
 *
 * Body:
 * {
 *   resolution_remarks
 * }
 */
export const resolveComplaint = async (
  complaintId,
  resolutionRemarks
) => {
  try {
    const response = await api.patch(
      `/complaints/${complaintId}/resolve`,
      {
        resolution_remarks: resolutionRemarks,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error resolving complaint:', error);
    throw error;
  }
};


export default {
  getBackendStatus,
  submitComplaint,
  getComplaints,
  assignComplaint,
  updateComplaintStatus,
  resolveComplaint,
};