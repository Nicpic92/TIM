import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

// Define the standard keys the application expects from the spreadsheet.
// This list dictates the structure of the saved 'columnMappings' object.
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
 */
function ConfigForm({ formData, setFormData, onSave, onClear, isSubmitting }) {
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
          />
        </div>

        {/* Step 2: Column Mapping */}
        <h5 className="mt-4">Column Mapping</h5>
        <p className="text-muted small">
          Map the headers from the client's spreadsheet (Source Column Name) to our standard system fields (Standard Key).
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
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.columnMappings?.[item.key] || ''}
                      onChange={(e) => handleMappingChange(item.key, e.target.value)}
                      placeholder="e.g., CLAIM_ID"
                      required={item.required}
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Placeholder for PDF Builder - Replaces old alert */}
        <div className="alert alert-info">
          <i className="bi bi-info-circle-fill me-2"></i>
          PDF report builder sections will be added here.
        </div>

        <hr />
        
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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
          disabled={isSubmitting}
        >
          Clear Form
        </button>
      </fieldset>
    </form>
  );
}

export default ConfigForm;
