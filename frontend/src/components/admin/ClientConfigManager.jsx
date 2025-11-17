import { useState } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { fileService } from '../../services/fileService'; // Import fileService

// Import child components
import ConfigList from './ConfigList';
import ConfigForm from './ConfigForm';

const initialFormData = {
  id: null,
  config_name: '',
  columnMappings: {},
  pdfConfig: {},
  // NEW: State to store headers discovered from an uploaded file
  availableHeaders: [], 
};

/**
 * Manages the UI for creating, editing, and listing client configurations.
 * @param {object} props
 * @param {Array} props.configs - The list of all client configurations.
 * @param {Function} props.onConfigChange - Callback to refetch all admin data.
 */
function ClientConfigManager({ configs, onConfigChange }) {
  // Update state initialization to include availableHeaders
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); 
  const [isDiscovering, setIsDiscovering] = useState(false); // New state for discovery status

  const handleEdit = (config) => {
    console.log('Editing config:', config);
    // When editing, pull all data from the existing config
    setFormData({
      id: config.id,
      config_name: config.config_name,
      columnMappings: config.config_data?.columnMappings || {},
      pdfConfig: config.config_data?.pdfConfig || {},
      config_data: config.config_data || {},
      // When editing, clear available headers as they are context-dependent
      availableHeaders: [], 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleClearForm = () => {
    setFormData(initialFormData);
  };

  /**
   * Handles the file upload and extracts all headers from the report.
   * @param {File} file The claims report file.
   */
  const handleHeaderDiscovery = async (file) => {
    if (!file) return;

    setIsDiscovering(true);
    const toastId = toast.loading('Reading and analyzing spreadsheet headers...');
    
    try {
      // Use the existing file service to parse the file
      const data = await fileService.parseXlsxFile(file);
      
      if (data.length === 0) {
        toast.error('File contains no data rows.', { id: toastId });
        return;
      }
      
      // Get all unique keys from the first row (headers)
      const discoveredHeaders = Object.keys(data[0]);
      
      setFormData(prev => ({
        ...prev,
        // Store headers alphabetically
        availableHeaders: discoveredHeaders.sort(),
        // Clear existing mappings, as headers have changed
        columnMappings: {}, 
      }));

      toast.success(`Found ${discoveredHeaders.length} headers. You can now map them.`, { id: toastId });
      
    } catch (error) {
      toast.error(error.message || 'Failed to process file for headers.', { id: toastId });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.config_name) {
      toast.error('Configuration Name is required.');
      return;
    }
    
    // Validation for required mappings
    const requiredMappingKeys = ['claimId', 'state', 'status', 'age', 'netPayment', 'totalCharges', 'providerName', 'notes', 'edit'];
    const isMappingComplete = requiredMappingKeys.every(key => formData.columnMappings?.[key]?.trim());

    if (!isMappingComplete) {
        toast.error('All required column mappings must be selected.');
        return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(formData.id ? 'Updating configuration...' : 'Creating configuration...');

    try {
      // Assemble the final config_data payload
      const config_data = {
        ...(formData.config_data || {}), 
        columnMappings: formData.columnMappings,
        pdfConfig: formData.pdfConfig,
        clientName: formData.config_name, 
      };

      const payload = {
        config_name: formData.config_name,
        config_data: config_data, 
      };

      if (formData.id) {
        await apiService.updateConfig(formData.id, payload);
      } else {
        await apiService.createConfig(payload);
      }
      
      toast.success('Configuration saved successfully!', { id: toastId });
      handleClearForm();
      await onConfigChange();
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
      await onConfigChange();
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
              // NEW PROPS
              availableHeaders={formData.availableHeaders}
              onHeaderDiscovery={handleHeaderDiscovery}
              isDiscovering={isDiscovering}
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
