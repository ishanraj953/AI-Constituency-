import axios from 'axios';

const base = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: base ? base : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      
      // Do not redirect on login/register 401s so error messages are shown in form
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);




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
 * Submit a citizen complaint with a geo-tagged image
 * POST /complaints
 */
export const submitComplaint = async (
  complaint,
  location,
  pincode,
  wardNo,
  image
) => {
  try {
    const formData = new FormData()

    formData.append('complaint', complaint)
    formData.append('location', location)
    formData.append('pincode', pincode || '')
    formData.append('ward_no', wardNo || '')

    if (image) {
      formData.append('image', image)
    }

    const response = await api.post(
      '/complaints',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data

  } catch (error) {
    console.error(
      'Error submitting complaint:',
      error.response?.data || error
    )

    throw error
  }
}


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
 * Track a complaint by Complaint ID
 * GET /complaints/{complaint_id}/track
 */
export const trackComplaint = async (complaintId) => {
  try {
    const response = await api.get(
      `/complaints/${encodeURIComponent(complaintId.trim())}/track`
    )

    return response.data
  } catch (error) {
    console.error('Error tracking complaint:', error)
    throw error
  }
}

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

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (name, email, password, role = "USER") => {
  try {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
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
  trackComplaint,
  login,
  register
};