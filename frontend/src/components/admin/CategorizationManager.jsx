import React from 'react';

/**
 * Manages the UI for Teams, Categories, Associations, and Rules.
 * @param {object} props
 * in the future to keep the UI snappy without a full page reload.
 * @param {Array} props.teams - The list of all teams.
 * @param {Array} props.categories - The list of all categories.
 * @param {Array} props.configs - The list of all client configurations.
 * @param {Function} props.onDataChange - Callback to refetch all admin data.
 */
function CategorizationManager({ teams, categories, configs, onDataChange }) {
  return (
    <div className="card">
      <div className="card-body">
        <h2>Client-Specific Categorization & Team Management</h2>
        <p className="text-muted">
          Manage teams and categories globally, then create rules for each client to automatically assign claims.
        </p>
        <hr />
        
        {/* We will build the tabbed interface here */}
        <p className="text-muted fst-italic">
          Team Manager ({teams.length} teams), Category Manager ({categories.length} categories), 
          and Rule Manager ({configs.length} configs) will be built here.
        </p>
      </div>
    </div>
  );
}

export default CategorizationManager;
