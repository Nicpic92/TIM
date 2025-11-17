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

// NEW: Hardcoded list of all client report headers as requested by the user.
const HARDCODED_HEADERS = [
    'Payer', 'Category', 'Claim Number', 'Type', 'Received Date', 
    'Billing Provider Name', 'Billing Provider Tax ID', 'Billing Provider NPI', 
    'Claim State', 'Claim Status', 'Patient', 'Subs Id', 'Rendering Provider Name', 
    'Rendering Provider NPI', 'DOSFromDate', 'DOSToDate', 'Clean Age', 'Age', 
    'TotalCharges', 'TotalNetPaymentAmt', 'NetworkStatus', 'PBP Name', 'Plan Name', 
    'DSNP or Non DSNP', 'Claim Edits', 'Claim Notes', 'Activity Logger Description', 
    'Activity Performed By', 'Activity Performed On'
];

/**
 * Renders the form for creating or editing a client configuration.
// ... (omitted props for brevity, but they are all still used)
 */
function ConfigForm({ formData, setFormData, onSave, onClear, isSubmitting, availableHeaders, onHeaderDiscovery, isDiscovering }) {
  
  const fileInputKey = formData.id || availableHeaders.length;

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleMappingChange = (standardKey, columnValue) => {
    setFormData((prev) => ({
      ...prev,
      columnMappings: {
        ...prev.columnMappings,
        [standardKey]: columnValue,
      },
    }));
  };

  // Determine which list of headers to use for the dropdowns
  // Always prioritize the hardcoded list for display
  const headersToUse = HARDCODED_HEADERS.length > 0 ? HARDCODED_HEADERS : availableHeaders;
  const isHeadersAvailable = headersToUse.length > 0;

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

        {/* 1. Discover Report Headers (File Upload remains optional but is now superseded) */}
        <h5 className="mt-4">1. Discover Report Headers (Optional)</h5>
        <p className="text-muted small">
          **Note:** Column headers below are now permanently hardcoded from your specified list. Uploading a file here will only validate the headers you enter.
        </p>
        <div className="input-group mb-3">
            <input
                key={fileInputKey}
                type="file"
                className="form-control"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => onHeaderDiscovery(e.target.files[0])}
                disabled={isSubmitting || isDiscovering}
            />
             <button 
              className="btn btn-primary" 
              type="button" 
              disabled={true}
            >
              {isDiscovering ? <><LoadingSpinner /> Analyzing...</> : 'Scan Headers'}
            </button>
        </div>
        
        {/* Display message confirming hardcoded headers */}
        <div className="alert alert-warning small py-2">
            **{HARDCODED_HEADERS.length} Hardcoded Headers** loaded for mapping.
        </div>
        
        {/* 2. Column Mapping */}
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
                    {isHeadersAvailable ? (
                      <select
                        className="form-select form-select-sm"
                        value={formData.columnMappings?.[item.key] || ''}
                        onChange={(e) => handleMappingChange(item.key, e.target.value)}
                        required={item.required}
                        disabled={isSubmitting || isDiscovering}
                      >
                        <option value="">Select a header...</option>
                        {headersToUse.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    ) : (
                       // Fallback remains as manual input (though less necessary now)
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.columnMappings?.[item.key] || ''}
                        onChange={(e) => handleMappingChange(item.key, e.target.value)}
                        placeholder="Select header name"
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
