import axios from 'axios';

const base = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({
  baseURL: base ? `${base}/analytics` : '/api/analytics',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch top analytics overview KPI counts
 * GET /analytics/statistics
 */
export const getStatistics = async () => {
  const response = await api.get('/statistics');
  return response.data;
};


/**
 * Fetch top 10 categories
 * GET /analytics/top-issues
 */
export const getTopIssues = async () => {
  const response = await api.get('/top-issues');
  return response.data;
};

/**
 * Fetch percentage contribution of all categories
 * GET /analytics/category-distribution
 */
export const getCategoryDistribution = async () => {
  const response = await api.get('/category-distribution');
  return response.data;
};

/**
 * Fetch priority distribution doughnut values
 * GET /analytics/priority-distribution
 */
export const getPriorityDistribution = async () => {
  const response = await api.get('/priority-distribution');
  return response.data;
};

/**
 * Fetch top 10 ward analysis counts
 * GET /analytics/ward-analysis
 */
export const getWardAnalysis = async () => {
  const response = await api.get('/ward-analysis');
  return response.data;
};

/**
 * Fetch live dynamic text summary of daily activities
 * GET /analytics/activity-summary
 */
export const getActivitySummary = async () => {
  const response = await api.get('/activity-summary');
  return response.data;
};

export default {
  getStatistics,
  getTopIssues,
  getCategoryDistribution,
  getPriorityDistribution,
  getWardAnalysis,
  getActivitySummary,
};
