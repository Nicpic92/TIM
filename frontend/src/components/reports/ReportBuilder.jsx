import { useState, useMemo } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Manages the UI for viewing and editing Team Report Configurations.
 * A Report Config is tied to a unique Team ID and Category ID.
 * @param {object} props
 * @param {Array} props.teams - The list of all teams.
 * @param {Array} props.categories - The list of all categories.
 * @param {Array} props.reportConfigs - The list of existing report configurations.
 * @param {Function} props.onDataChange - Callback to refetch all data.
 */
function ReportBuilder({ teams, categories, reportConfigs, onDataChange }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  // Use {} as initial state for JSON data
  const [configFormData, setConfigFormData] = useState({}); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState(null);

  // Memoize categories grouped by team name for organized selection
  const groupedCategories = useMemo(() => {
    return categories.reduce((acc, cat) => {
      // Find the team name using the team_id
      const teamName = teams.find(t => t.id === cat.team_id)?.team_name || 'Unassigned';
      (acc[teamName] = acc[teamName] || []).push(cat);
      return acc;
    }, {});
  }, [categories, teams]);

  // Handle changes in team or category selection
  const handleSelectionChange = (teamId, categoryId) => {
    // If team changes, reset category. If category changes, keep team.
    const newTeamId = teamId || selectedTeamId;
    const newCategoryId = categoryId;
    
    setSelectedTeamId(newTeamId);
    setSelectedCategoryId(newCategoryId);
    setCurrentConfigId(null);
    setConfigFormData({});

    if (newTeamId && newCategoryId) {
      const existingConfig = reportConfigs.find(
        c => c.team_id == newTeamId && c.category_id == newCategoryId
      );
      
      if (existingConfig) {
        setCurrentConfigId(existingConfig.id);
        // Display the existing JSON formatted nicely
        setConfigFormData(existingConfig.report_config_data || {});
        toast.success(`Editing existing configuration.`, { duration: 1500 });
      } else {
        // Start with an empty object for a new config
        setConfigFormData({});
        toast('Creating a new configuration.', { duration: 1500, icon: '📝' });
      }
    }
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedCategoryId) {
      toast.error('Please select both a Team and a Category.');
      return;
    }

    // Check if configFormData is currently a string (invalid JSON)
    if (typeof configFormData === 'string') {
        toast.error('Cannot save: Configuration data is invalid JSON.');
        return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading(currentConfigId ? 'Updating Report Config...' : 'Creating Report Config...');
    
    try {
      const payload = {
        team_id: parseInt(selectedTeamId, 10),
        category_id: parseInt(selectedCategoryId, 10),
        report_config_data: configFormData,
      };

      if (currentConfigId) {
        // PUT request to update existing configuration
        await apiService.updateTeamReportConfig(currentConfigId, payload);
      } else {
        // POST request to create new configuration
        await apiService.createTeamReportConfig(payload);
      }

      toast.success('Report Configuration saved successfully!', { id: toastId });
      // Reset selections and refetch all data to update the table/list
      handleSelectionChange('', '');
      await onDataChange();
    } catch (error) {
      toast.error(error.message || 'Failed to save report configuration.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTeam = teams.find(t => t.id == selectedTeamId)?.team_name;
  const currentCategory = categories.find(c => c.id == selectedCategoryId)?.category_name;

  const handleJsonInputChange = (e) => {
    const rawValue = e.target.value;
    try {
        // Try to parse to check if it is valid JSON
        setConfigFormData(JSON.parse(rawValue));
    } catch {
        // If parsing fails, store the raw text (which will disable the save button)
        setConfigFormData(rawValue); 
    }
  };


  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Report Configuration Builder</h2>
        <p className="text-muted">
          Design a custom report layout that will be generated for a specific Team/Category combination.
        </p>

        <form onSubmit={handleSave}>
          <div className="row g-3 mb-4">
            {/* Team Selector */}
            <div className="col-md-6">
              <label htmlFor="teamSelector" className="form-label fw-bold">1. Select Team</label>
              <select
                id="teamSelector"
                className="form-select"
                value={selectedTeamId}
                // When team changes, reset category to force a re-selection
                onChange={(e) => handleSelectionChange(e.target.value, '')} 
                disabled={isSubmitting}
                required
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.team_name}</option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="col-md-6">
              <label htmlFor="categorySelector" className="form-label fw-bold">2. Select Category</label>
              <select
                id="categorySelector"
                className="form-select"
                value={selectedCategoryId}
                onChange={(e) => handleSelectionChange(selectedTeamId, e.target.value)}
                disabled={!selectedTeamId || isSubmitting}
                required
              >
                <option value="">Select a category...</option>
                {/* Only show categories belonging to the selected team */}
                {selectedTeamId && 
                  (groupedCategories[currentTeam] || []).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <hr />

          {/* Configuration Editor - Only displayed after both are selected */}
          {selectedTeamId && selectedCategoryId ? (
            <div className="mb-3">
                <p className='fw-bold'>
                    3. Define Report Structure for: 
                    <span className='badge bg-primary ms-2'>{currentTeam} / {currentCategory}</span>
                    <span className='badge bg-secondary ms-2'>{currentConfigId ? `Config ID: ${currentConfigId}` : 'NEW'}</span>
                </p>
                <label htmlFor="reportConfigData" className="form-label">
                    Report Configuration JSON (Define Columns, Filters, etc.)
                </label>
                <textarea
                    id="reportConfigData"
                    className="form-control"
                    rows="10"
                    placeholder={`e.g., {"columns": ["claimId", "providerName"], "sort": "age"}`}
                    // Display current config, formatting objects to JSON string for the textarea
                    value={typeof configFormData === 'string' ? configFormData : JSON.stringify(configFormData, null, 2)}
                    onChange={handleJsonInputChange}
                    required
                    disabled={isSubmitting}
                />
                
                <button 
                    type="submit" 
                    className="btn btn-success mt-3" 
                    // Disable save button if submitting or if the data is a string (invalid JSON)
                    disabled={isSubmitting || typeof configFormData === 'string'}
                >
                    {isSubmitting ? <><LoadingSpinner /> Saving...</> : 'Save Report Configuration'}
                </button>
                {typeof configFormData === 'string' && (
                    <div className="alert alert-danger mt-3">
                        Invalid JSON format detected. Please correct the syntax before saving.
                    </div>
                )}
            </div>
          ) : (
            <div className="alert alert-info">
              Select a Team and a Category to define a custom report configuration.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ReportBuilder;
