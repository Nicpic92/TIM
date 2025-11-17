// The base URL for all our serverless functions
const API_BASE_URL = '/.netlify/functions';

/**
 * A generic API call utility.
 * @param {string} endpoint The function endpoint (e.g., '/teams').
 * @param {object} [options={}] Optional fetch options (method, body, etc.).
 * @returns {Promise<any>} The JSON response from the API.
 */
async function apiCall(endpoint, options = {}) {
  const { body, ...customConfig } = options;
  
  const headers = { 'Content-Type': 'application/json' };
  
  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // DELETE requests might not return a body, but are still successful.
    if (response.status === 204) {
      return; 
    }
    
    const data = await response.json();

    if (!response.ok) {
      // Throw an error object that includes the message from the API
      const error = new Error(data.error || `API Error: ${response.statusText}`);
      error.status = response.status;
      error.details = data.details; // Include validation details if present
      throw error;
    }
    
    return data;
  } catch (error) {
    // Re-throw the error to be caught by the calling component
    console.error('API call failed:', error);
    throw error;
  }
}

// --- API Service Object ---
// We export a single object containing all our specific API functions.
export const apiService = {
  // Teams
  getTeams: () => apiCall('/teams'),
  createTeam: (teamData) => apiCall('/teams', { method: 'POST', body: teamData }),
  deleteTeam: (id) => apiCall(`/teams?id=${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => apiCall('/categories'),
  createCategory: (categoryData) => apiCall('/categories', { method: 'POST', body: categoryData }),
  deleteCategory: (id) => apiCall(`/categories?id=${id}`, { method: 'DELETE' }),

  // Configurations
  getConfigs: () => apiCall('/configurations'),
  createConfig: (configData) => apiCall('/configurations', { method: 'POST', body: configData }),
  updateConfig: (id, configData) => apiCall(`/configurations?id=${id}`, { method: 'PUT', body: configData }),
  deleteConfig: (id) => apiCall(`/configurations?id=${id}`, { method: 'DELETE' }),

  // Client-Team Associations
  getClientTeamAssociations: (configId) => apiCall(`/client-team-associations?config_id=${configId}`),
  getAllClientTeamAssociations: () => apiCall('/client-team-associations'),
  saveClientTeamAssociations: (assocData) => apiCall('/client-team-associations', { method: 'POST', body: assocData }),
  
  // Client Rules
  getRules: (type, configId) => apiCall(`/client-rules?type=${type}&config_id=${configId}`),
  saveRules: (type, configId, rules) => apiCall(`/client-rules?type=${type}&config_id=${configId}`, { method: 'POST', body: rules }),
  deleteRule: (type, configId, ruleText) => apiCall(`/client-rules?type=${type}&config_id=${configId}`, { method: 'DELETE', body: { text: ruleText } }),
  
  // Team Report Configs
  getTeamReportConfigs: () => apiCall('/team-report-configs'),
  createTeamReportConfig: (reportData) => apiCall('/team-report-configs', { method: 'POST', body: reportData }),
  updateTeamReportConfig: (id, reportData) => apiCall(`/team-report-configs?id=${id}`, { method: 'PUT', body: reportData }),
  deleteTeamReportConfig: (id) => apiCall(`/team-report-configs?id=${id}`, { method: 'DELETE' }),
};
