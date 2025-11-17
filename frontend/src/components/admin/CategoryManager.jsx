import { useState } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const initialFormData = {
  category_name: '',
  team_id: '',
  send_to_l1_monitor: false,
};

/**
 * Manages the UI for adding, listing, and deleting categories.
 * @param {object} props
 * @param {Array} props.categories - The list of all categories.
 * @param {Array} props.teams - The list of all teams for the dropdown.
 * @param {Function} props.onDataChange - Callback to refetch all admin data.
 */
function CategoryManager({ categories, teams, onDataChange }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.category_name.trim() || !formData.team_id) {
      toast.error('Please select a team and enter a category name.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Adding new category...');

    try {
      const payload = {
        ...formData,
        team_id: parseInt(formData.team_id, 10),
      };
      await apiService.createCategory(payload);
      toast.success('Category added successfully!', { id: toastId });
      setFormData(initialFormData);
      await onDataChange();
    } catch (error) {
      toast.error(error.message || 'Failed to add category.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated rules will also be deleted.')) {
      return;
    }
    
    setIsDeleting(categoryId);
    const toastId = toast.loading('Deleting category...');

    try {
      await apiService.deleteCategory(categoryId);
      toast.success('Category deleted successfully!', { id: toastId });
      await onDataChange();
    } catch (error) {
      toast.error(error.message || 'Failed to delete category.', { id: toastId });
    } finally {
      setIsDeleting(null);
    }
  };

  // Group categories by team name for organized display
  const groupedCategories = categories.reduce((acc, cat) => {
    const teamName = cat.team_name || 'Unassigned';
    (acc[teamName] = acc[teamName] || []).push(cat);
    return acc;
  }, {});

  return (
    <div>
      <h5>Manage Categories</h5>
      
      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="mb-4">
        <div className="mb-2">
          <select
            id="team_id"
            className="form-select"
            value={formData.team_id}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
          >
            <option value="">Select team to add to...</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.team_name}</option>
            ))}
          </select>
        </div>
        <div className="d-flex">
          <input
            type="text"
            id="category_name"
            className="form-control me-2"
            placeholder="New Category Name"
            value={formData.category_name}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner /> : 'Add'}
          </button>
        </div>
        <div className="form-check mt-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="send_to_l1_monitor"
            checked={formData.send_to_l1_monitor}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
          <label className="form-check-label" htmlFor="send_to_l1_monitor">
            Include in L1 Monitor Report
          </label>
        </div>
      </form>

      {/* Category List */}
      <div id="categoryListContainer">
        {Object.keys(groupedCategories).sort().map(teamName => (
          <div key={teamName} className="card mb-2">
            <div className="card-header py-1">{teamName}</div>
            <ul className="list-group list-group-flush">
              {groupedCategories[teamName].sort((a, b) => a.category_name.localeCompare(b.category_name)).map(cat => (
                <li key={cat.id} className="list-group-item py-1 d-flex justify-content-between align-items-center">
                  <span>
                    {cat.category_name}
                    {cat.send_to_l1_monitor && <span className="badge bg-info text-dark ms-2">L1 Monitor</span>}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm py-0 px-1"
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={isDeleting === cat.id}
                    style={{ lineHeight: 1 }}
                  >
                    {isDeleting === cat.id ? <LoadingSpinner/> : '×'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryManager;
