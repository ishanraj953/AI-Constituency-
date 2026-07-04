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
 * Body: { complaint, location }
 */
export const submitComplaint = async (complaint, location) => {
  try {
    const response = await api.post('/complaints', { complaint, location });
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

export default {
  getBackendStatus,
  submitComplaint,
  getComplaints,
};
