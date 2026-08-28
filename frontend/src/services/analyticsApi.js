import { api } from './api';


/**
 * Fetch top analytics overview KPI counts
 * GET /analytics/statistics
 */
export const getStatistics = async () => {
  const response = await api.get('/analytics/statistics');
  return response.data;
};


/**
 * Fetch top 10 categories
 * GET /analytics/top-issues
 */
export const getTopIssues = async () => {
  const response = await api.get('/analytics/top-issues');
  return response.data;
};

/**
 * Fetch percentage contribution of all categories
 * GET /analytics/category-distribution
 */
export const getCategoryDistribution = async () => {
  const response = await api.get('/analytics/category-distribution');
  return response.data;
};

/**
 * Fetch priority distribution doughnut values
 * GET /analytics/priority-distribution
 */
export const getPriorityDistribution = async () => {
  const response = await api.get('/analytics/priority-distribution');
  return response.data;
};

/**
 * Fetch top 10 ward analysis counts
 * GET /analytics/ward-analysis
 */
export const getWardAnalysis = async () => {
  const response = await api.get('/analytics/ward-analysis');
  return response.data;
};

/**
 * Fetch live dynamic text summary of daily activities
 * GET /analytics/activity-summary
 */
export const getActivitySummary = async () => {
  const response = await api.get('/analytics/activity-summary');
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
