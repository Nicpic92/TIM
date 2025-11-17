import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

// Define the standard keys the application expects from the spreadsheet.
const STANDARD_KEYS = [
  { key: 'claimId', label: 'Claim ID', required: true },
  { key: 'state', label: 'State (e.g., PEND, ONHOLD)', required: true },
  { key: 'status', label: 'Status (e.g., DENY)', required: true },
  { key: 'age', label: 'Age (in Days)', required: true },
  { key: 'netPayment', label: 'Net Payment / Amount at Risk', required: true },
  { key: 'totalCharges', label: 'Total Charges (for Priority Score)', required: true },
  { key: 'providerName', label: 'Billing Provider Name', required: true },
  { key: 'notes', label: 'Claim Notes/Remarks (for Note Rules)', required: true },
  { key: 'edit', label: 'Claim Edit Code (for Edit Rules)', required: true },
];

/**
 * Renders the form for creating or editing a client configuration.
 * @param {object} props
 * @param {object} props.formData - The current state of the form data.
 * @param {Function} props.setFormData - Function to update the form data state.
 * @param {Function} props.onSave - Callback function to handle form submission.
 * @param {Function} props.onClear - Callback function to clear the form.
 * @param {boolean} props.isSubmitting - Flag indicating if the form is currently being submitted.
 * @param {Array<string>} props.availableHeaders - Headers discovered from the uploaded file.
 * @param {Function} props.onHeaderDiscovery - Callback to process the uploaded file.
 * @param {boolean} props.isDiscovering - Flag indicating if header discovery is ongoing.
 */
function ConfigForm({ formData, setFormData, onSave, onClear, isSubmitting, availableHeaders, onHeaderDiscovery, isDiscovering }) {
  
  // Use a key to force re-render/reset of the file input when availableHeaders changes
  const fileInputKey = formData.id || availableHeaders.length;

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  // Handles changes to the column mapping fields
  const handleMappingChange = (standardKey, columnValue) => {
    setFormData((prev) => ({
      ...prev,
      columnMappings: {
        ...prev.columnMappings,
        [standardKey]: columnValue,
      },
    }));
  };

  return (
    <form onSubmit={onSave}>
      <fieldset>
        <legend>{formData.id ? 'Edit Configuration' : 'Create New Configuration'}</legend>
        
        {/* Step 1: Basic Information */}
        <div className="mb-3">
          <label htmlFor="config_name" className="form-label">
            Configuration Name
          </label>
          <input
            type="text"
            className="form-control"
            id="config_name"
            value={formData.config_name}
            onChange={handleInputChange}
            required
            placeholder="e.g., National Health Group"
            disabled={isSubmitting || isDiscovering}
          />
        </div>

        {/* NEW: Step 2: Header Discovery */}
        <h5 className="mt-4">1. Discover Report Headers</h5>
        <p className="text-muted small">
          Upload a sample claims report (XLSX) to automatically extract available column headers.
        </p>
        <div className="input-group mb-3">
            <input
                key={fileInputKey} // Use key to reset input field
                type="file"
                className="form-control"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => onHeaderDiscovery(e.target.files[0])}
                disabled={isSubmitting || isDiscovering}
            />
             <button 
              className="btn btn-primary" 
              type="button" 
              disabled={true} // Disable button since change event on input triggers the action
            >
              {isDiscovering ? <><LoadingSpinner /> Analyzing...</> : 'Scan Headers'}
            </button>
        </div>
        
        {availableHeaders.length > 0 && (
          <div className="alert alert-success small py-2">
            Headers Discovered: **{availableHeaders.join(', ')}**
          </div>
        )}
        
        {/* Step 3: Column Mapping - Now uses Select/Dropdown */}
        <h5 className="mt-4">2. Column Mapping</h5>
        <p className="text-muted small">
          Select the client's report headers to map to the standard system fields.
        </p>

        <div className="table-responsive mb-4">
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th>Standard Key (System Field)</th>
                <th>Source Column Name (Client Header)</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_KEYS.map((item) => (
                <tr key={item.key}>
                  <td className={item.required ? 'fw-bold' : ''}>
                    {item.label}
                  </td>
                  <td>
                    {availableHeaders.length > 0 ? (
                      <select
                        className="form-select form-select-sm"
                        value={formData.columnMappings?.[item.key] || ''}
                        onChange={(e) => handleMappingChange(item.key, e.target.value)}
                        required={item.required}
                        disabled={isSubmitting || isDiscovering}
                      >
                        <option value="">Select a header...</option>
                        {availableHeaders.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    ) : (
                       // Fallback to manual input if no headers are discovered
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.columnMappings?.[item.key] || ''}
                        onChange={(e) => handleMappingChange(item.key, e.target.value)}
                        placeholder="Upload file or type header name"
                        required={item.required}
                        disabled={isSubmitting || isDiscovering}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Placeholder for PDF Builder */}
        <h5 className='mt-4'>3. PDF Report Builder (Coming Soon)</h5>
        <div className="alert alert-info">
          <i className="bi bi-info-circle-fill me-2"></i>
          PDF report builder sections will be added here.
        </div>

        <hr />
        
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || isDiscovering}>
          {isSubmitting ? (
            <>
              <LoadingSpinner /> {formData.id ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            formData.id ? 'Update Configuration' : 'Save Configuration'
          )}
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={onClear}
          disabled={isSubmitting || isDiscovering}
        >
          Clear Form
        </button>
      </fieldset>
    </form>
  );
}

export default ConfigForm;
