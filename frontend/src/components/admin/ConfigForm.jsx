import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

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

        {/* 
          Placeholder for future, more complex form sections.
          We will add the file uploader, column mappings, and PDF builder UI here later.
        */}
        <div className="alert alert-info">
          <i className="bi bi-info-circle-fill me-2"></i>
          Column mapping and PDF report builder sections will be added here.
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
