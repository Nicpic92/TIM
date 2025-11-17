import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Manages the UI for associating teams with a specific client configuration.
 * @param {object} props
 * @param {Array} props.configs - The list of all client configurations.
 * @param {Array} props.teams - The list of all teams.
 */
function ClientTeamAssociationManager({ configs, teams }) {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [associatedTeamIds, setAssociatedTeamIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch associations whenever the selected client changes
  useEffect(() => {
    if (!selectedConfigId) {
      setAssociatedTeamIds(new Set());
      return;
    }

    const fetchAssociations = async () => {
      setIsLoading(true);
      try {
        const teamIds = await apiService.getClientTeamAssociations(selectedConfigId);
        setAssociatedTeamIds(new Set(teamIds));
      } catch (error) {
        toast.error(error.message || 'Failed to fetch associations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssociations();
  }, [selectedConfigId]);

  const handleCheckboxChange = (teamId, isChecked) => {
    setAssociatedTeamIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(teamId);
      } else {
        newSet.delete(teamId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedConfigId) {
        toast.error('Please select a client first.');
        return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving associations...');

    try {
        const payload = {
            config_id: parseInt(selectedConfigId, 10),
            team_ids: Array.from(associatedTeamIds)
        };
        await apiService.saveClientTeamAssociations(payload);
        toast.success('Associations saved successfully!', { id: toastId });
    } catch (error) {
        toast.error(error.message || 'Failed to save associations.', { id: toastId });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div>
      <h5 className="mt-4">Manage Client-Team Associations</h5>
      <div className="mb-3">
        <label htmlFor="clientTeamConfigSelector" className="form-label">
          Select Client
        </label>
        <select
          id="clientTeamConfigSelector"
          className="form-select"
          value={selectedConfigId}
          onChange={(e) => setSelectedConfigId(e.target.value)}
        >
          <option value="">Select a client...</option>
          {configs.map(config => (
            <option key={config.id} value={config.id}>{config.config_name}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Select Associated Teams</label>
        <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {isLoading ? (
            <div className="text-center p-3"><LoadingSpinner /></div>
          ) : !selectedConfigId ? (
            <small className="text-muted">Select a client to see teams.</small>
          ) : (
            teams.map(team => (
              <div key={team.id} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`team_check_${team.id}`}
                  checked={associatedTeamIds.has(team.id)}
                  onChange={(e) => handleCheckboxChange(team.id, e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`team_check_${team.id}`}>
                  {team.team_name}
                </label>
              </div>
            ))
          )}
        </div>
      </div>
      <button className="btn btn-success" onClick={handleSave} disabled={isSaving || !selectedConfigId}>
        {isSaving ? <LoadingSpinner /> : 'Save Associations'}
      </button>
    </div>
  );
}

export default ClientTeamAssociationManager;
