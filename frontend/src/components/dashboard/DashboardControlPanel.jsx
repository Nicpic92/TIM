import React from 'react';
import { fileService } from '../../services/fileService';
import toast from 'react-hot-toast';

/**
 * Renders the top control panel for selecting a config and uploading a file.
 * @param {object} props
 * @param {Array} props.configs - List of available configurations.
 * @param {object} props.selectedConfig - The currently selected configuration object.
 * @param {Function} props.onConfigChange - Callback when the config selection changes.
 * @param {Function} props.onProcessFile - Callback to process the data from an uploaded file.
 * @param {boolean} props.isProcessing - Flag indicating if a process is ongoing.
 */
function DashboardControlPanel({ configs, selectedConfig, onConfigChange, onProcessFile, isProcessing }) {
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Reading and parsing spreadsheet...');
    try {
      const jsonData = await fileService.parseXlsxFile(file);
      toast.dismiss(toastId);
      onProcessFile(jsonData);
    } catch (error) {
      toast.error(error.message || 'Failed to parse file.', { id: toastId });
    } finally {
      // Reset the file input so the same file can be re-uploaded
      event.target.value = '';
    }
  };

  return (
    <>
      {/* Report Options Card */}
      <div className="card p-3 mb-4">
        <h5 className="card-title fw-bold">1. Report Options</h5>
        <div className="row align-items-end">
          <div className="col-md-6 mb-3">
            <label htmlFor="configSelector" className="form-label small fw-bold">
              Select Report Configuration
            </label>
            <select
              id="configSelector"
              className="form-select"
              value={selectedConfig?.id || ''}
              onChange={(e) => onConfigChange(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Select a configuration...</option>
              {configs.map(config => (
                <option key={config.id} value={config.id}>{config.config_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="clientName" className="form-label small fw-bold">
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              className="form-control"
              value={selectedConfig?.config_data?.clientName || ''}
              readOnly
              placeholder="Select a configuration"
            />
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card p-3 mb-4 bg-light border-0">
        <h5 className="card-title fw-bold">2. Upload Claims Data</h5>
        <label htmlFor="reportFile" className="form-label">
          Select an XLSX file to begin analysis.
        </label>
        <input
          id="reportFile"
          className="form-control"
          type="file"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          disabled={!selectedConfig || isProcessing}
        />
      </div>
    </>
  );
}

export default DashboardControlPanel;
