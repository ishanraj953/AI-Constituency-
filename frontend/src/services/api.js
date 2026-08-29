import axios from 'axios';

const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const baseURL = envBase ? envBase.replace(/\/+$/, '') : '/api';

export const api = axios.create({
  baseURL,
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
  image,
  latitude,
  longitude
) => {
  try {
    const formData = new FormData()

    formData.append('complaint', complaint)
    formData.append('location', location)
    formData.append('pincode', pincode || '')
    formData.append('ward_no', wardNo || '')

    if (latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) && isFinite(Number(latitude))) {
      formData.append('latitude', String(Number(latitude)));
    }
    if (longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) && isFinite(Number(longitude))) {
      formData.append('longitude', String(Number(longitude)));
    }

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
 * Track a complaint by Complaint ID (authenticated user)
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
 * Public Track a complaint by Complaint ID (no auth required)
 * GET /public/track/{complaint_id}
 */
export const publicTrackComplaint = async (complaintId) => {
  try {
    const response = await api.get(
      `/public/track/${encodeURIComponent(complaintId.trim())}`
    )
    return response.data
  } catch (error) {
    console.error('Error in public tracking:', error)
    throw error
  }
}

/**
 * Get Public Live Stats
 * GET /public/stats
 */
export const getPublicStats = async () => {
  try {
    const response = await api.get('/public/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching public stats:', error)
    return {
      total_complaints: 0,
      resolved_complaints: 0,
      active_complaints: 0,
      verified_images: 0,
      departments_count: 17,
      average_resolution_hours: 36
    }
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

export const register = async ({
  name,
  email,
  password,
  role = 'USER',
  department = null,
  designation = null,
  secret_key = null
}) => {
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
      department,
      designation,
      secret_key
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Get Department Staff Accounts
 * GET /auth/staff?department=...
 */
export const getDepartmentStaff = async (department = null) => {
  try {
    const params = department ? { department } : {};
    const response = await api.get('/auth/staff', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching department staff:', error);
    return { count: 0, staff: [] };
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
  publicTrackComplaint,
  getPublicStats,
  getDepartmentStaff,
  login,
  register
};