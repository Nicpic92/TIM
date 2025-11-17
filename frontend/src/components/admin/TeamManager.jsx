import { useState } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Manages the UI for adding, listing, and deleting teams.
 * @param {object} props
 * @param {Array} props.teams - The list of all teams.
 * @param {Function} props.onDataChange - Callback to refetch all admin data.
 */
function TeamManager({ teams, onDataChange }) {
  const [newTeamName, setNewTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Tracks ID of team being deleted

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error('Team name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Adding new team...');

    try {
      await apiService.createTeam({ team_name: newTeamName });
      toast.success('Team added successfully!', { id: toastId });
      setNewTeamName('');
      await onDataChange(); // Refetch all data
    } catch (error) {
      toast.error(error.message || 'Failed to add team.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team? This may affect existing categories.')) {
      return;
    }
    
    setIsDeleting(teamId);
    const toastId = toast.loading('Deleting team...');

    try {
      await apiService.deleteTeam(teamId);
      toast.success('Team deleted successfully!', { id: toastId });
      await onDataChange();
    } catch (error) {
      toast.error(error.message || 'Failed to delete team.', { id: toastId });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      <h5>Manage Teams</h5>
      
      {/* Team List */}
      <ul className="list-group mb-3">
        {teams.length > 0 ? (
          teams.map((team) => (
            <li key={team.id} className="list-group-item py-1 d-flex justify-content-between align-items-center">
              {team.team_name}
              <button
                type="button"
                className="btn btn-outline-danger btn-sm py-0 px-1"
                onClick={() => handleDeleteTeam(team.id)}
                disabled={isDeleting === team.id}
                style={{ lineHeight: 1 }}
              >
                {isDeleting === team.id ? <LoadingSpinner/> : '×'}
              </button>
            </li>
          ))
        ) : (
          <li className="list-group-item">No teams defined yet.</li>
        )}
      </ul>

      {/* Add Team Form */}
      <form onSubmit={handleAddTeam} className="d-flex">
        <input
          type="text"
          className="form-control me-2"
          placeholder="New Team Name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
          {isSubmitting ? <LoadingSpinner /> : 'Add'}
        </button>
      </form>
    </div>
  );
}

export default TeamManager;
