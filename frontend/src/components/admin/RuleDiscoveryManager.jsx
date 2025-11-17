import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Manages the UI for discovering, assigning, and triaging new categorization rules.
 * @param {object} props
 * @param {Array} props.configs - The list of all client configurations.
 * @param {Array} props.categories - The list of all categories for assignment dropdowns.
 * @param {Function} props.onDataChange - Callback to refetch all admin data.
 */
function RuleDiscoveryManager({ configs, categories, onDataChange }) {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [existingRules, setExistingRules] = useState({ editRules: [], noteRules: [] });
  const [uncategorizedItems, setUncategorizedItems] = useState({ edits: [], notes: [] });

  const selectedConfig = configs.find(c => c.id == selectedConfigId);
  const canUpload = selectedConfig?.config_data?.columnMappings?.edit && selectedConfig?.config_data?.columnMappings?.notes;

  // Fetch existing rules when a new config is selected
  useEffect(() => {
    if (!selectedConfigId) {
      setExistingRules({ editRules: [], noteRules: [] });
      return;
    }

    const fetchRules = async () => {
      setIsLoadingRules(true);
      try {
        const [editRules, noteRules] = await Promise.all([
          apiService.getRules('edit', selectedConfigId),
          apiService.getRules('note', selectedConfigId),
        ]);
        setExistingRules({ editRules, noteRules });
      } catch (error) {
        toast.error(error.message || 'Failed to fetch existing rules.');
      } finally {
        setIsLoadingRules(false);
      }
    };

    fetchRules();
  }, [selectedConfigId]);

  const handleFileProcess = async (file) => {
    // Placeholder for the file processing logic
    setIsProcessingFile(true);
    console.log("Processing file:", file.name);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work
    toast.success('File processing logic to be implemented!');
    setIsProcessingFile(false);
  };

  return (
    <div>
      <div className="row bg-light p-3 rounded mb-3">
        {/* Step 1: Select Client */}
        <div className="col-md-6">
          <label className="form-label fw-bold">Select Client</label>
          <select
            className="form-select"
            value={selectedConfigId}
            onChange={(e) => setSelectedConfigId(e.target.value)}
            disabled={isProcessingFile}
          >
            <option value="">Select a client...</option>
            {configs.map(config => (
              <option key={config.id} value={config.id}>{config.config_name}</option>
            ))}
          </select>
          {isLoadingRules && <small className="text-muted"><LoadingSpinner /> Loading existing rules...</small>}
        </div>

        {/* Step 2: Upload Report */}
        <div className="col-md-6">
          <label className="form-label fw-bold">Upload Report</label>
          <input
            className="form-control"
            type="file"
            accept=".xlsx"
            disabled={!selectedConfigId || !canUpload || isProcessingFile || isLoadingRules}
            onChange={(e) => handleFileProcess(e.target.files[0])}
            key={selectedConfigId} // Reset file input when config changes
          />
          {selectedConfigId && !canUpload && (
            <small className="text-danger">
              This client's configuration must map both "Claim Edits" and "Claim Notes" to discover new rules.
            </small>
          )}
        </div>
      </div>

      {/* Step 3: Results & Assignment */}
      {isProcessingFile ? (
        <LoadingSpinner fullPage={true} />
      ) : (
        <div>
          {/* Uncategorized items table will be rendered here */}
          <div className="alert alert-info">
            Upload a file to begin the discovery process.
          </div>
        </div>
      )}
    </div>
  );
}

export default RuleDiscoveryManager;
