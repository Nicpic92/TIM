import { useState } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';

// Import child components (we will create these next)
import ConfigList from './ConfigList';
import ConfigForm from './ConfigForm';

const initialFormData = {
  id: null,
  config_name: '',
  // We will add more complex form data like mappings and PDF layouts later
};

/**
 * Manages the UI for creating, editing, and listing client configurations.
 * @param {object} props
 * @param {Array} props.configs - The list of all client configurations.
 * @param {Function} props.onConfigChange - Callback to refetch all admin data.
 */
function ClientConfigManager({ configs, onConfigChange }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Tracks the ID of the config being deleted

  const handleEdit = (config) => {
    console.log('Editing config:', config);
    setFormData({
      id: config.id,
      config_name: config.config_name,
      // More fields will be added here
    });
    // Scroll to the top of the form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleClearForm = () => {
    setFormData(initialFormData);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.config_name) {
      toast.error('Configuration Name is required.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(formData.id ? 'Updating configuration...' : 'Creating configuration...');

    try {
      // This is a placeholder for the complex config_data object
      const config_data = formData.id ? configs.find(c => c.id === formData.id)?.config_data || {} : {};

      const payload = {
        config_name: formData.config_name,
        config_data: config_data, 
      };

      if (formData.id) {
        // Update existing configuration
        await apiService.updateConfig(formData.id, payload);
      } else {
        // Create new configuration
        await apiService.createConfig(payload);
      }
      
      toast.success('Configuration saved successfully!', { id: toastId });
      handleClearForm();
      await onConfigChange(); // Trigger data refetch in parent
    } catch (error) {
      toast.error(error.message || 'Failed to save configuration.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(configId);
    const toastId = toast.loading('Deleting configuration...');

    try {
      await apiService.deleteConfig(configId);
      toast.success('Configuration deleted successfully!', { id: toastId });
      if (formData.id === configId) {
        handleClearForm();
      }
      await onConfigChange(); // Trigger data refetch
    } catch (error) {
      toast.error(error.message || 'Failed to delete configuration.', { id: toastId });
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <div className="card">
      <div className="card-body">
        <h2>Client Configurations</h2>
        <p className="text-muted">
          Manage settings for individual clients and their column mappings.
        </p>
        
        <div className="row g-4">
          <div className="col-lg-7">
            <ConfigForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onClear={handleClearForm}
              isSubmitting={isSubmitting}
            />
          </div>
          <div className="col-lg-5">
            <ConfigList
              configs={configs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientConfigManager;
