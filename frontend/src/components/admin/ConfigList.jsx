import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * Renders the list of existing client configurations.
 * @param {object} props
 * @param {Array} props.configs - The array of configuration objects.
 * @param {Function} props.onEdit - Callback function when the edit button is clicked.
 * @param {Function} props.onDelete - Callback function when the delete button is clicked.
 * @param {number|null} props.isDeleting - The ID of the config currently being deleted.
 */
function ConfigList({ configs, onEdit, onDelete, isDeleting }) {
  return (
    <div>
      <h5>Existing Configurations</h5>
      <p className="small text-muted">Click a name to edit.</p>
      
      {configs.length === 0 ? (
        <div className="list-group">
          <div className="list-group-item">No configurations found.</div>
        </div>
      ) : (
        <ul className="list-group">
          {configs.map((config) => (
            <li
              key={config.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <a
                href="#"
                className="flex-grow-1"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(config);
                }}
              >
                {config.config_name}
              </a>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(config.id)}
                disabled={isDeleting === config.id}
              >
                {isDeleting === config.id ? <LoadingSpinner /> : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ConfigList;
