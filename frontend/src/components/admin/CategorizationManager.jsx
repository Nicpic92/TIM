import React from 'react';

// Import child components
import TeamManager from './TeamManager';
import CategoryManager from './CategoryManager';
import ClientTeamAssociationManager from './ClientTeamAssociationManager';
import RuleDiscoveryManager from './RuleDiscoveryManager';
import RuleManager from './RuleManager'; // <-- Import the final component

/**
 * Manages the UI for Teams, Categories, Associations, and Rules.
 * @param {object} props
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

        <ul className="nav nav-tabs" id="ruleTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="setup-tab" data-bs-toggle="tab" data-bs-target="#setup-pane" type="button" role="tab">
              Setup
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="discover-tab" data-bs-toggle="tab" data-bs-target="#discover-pane" type="button" role="tab">
              Discover & Assign Rules
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="manage-rules-tab" data-bs-toggle="tab" data-bs-target="#manage-rules-pane" type="button" role="tab">
              Manage Existing Rules
            </button>
          </li>
        </ul>

        <div className="tab-content pt-3">
          {/* ----- TAB 1: SETUP (TEAMS, CATEGORIES, ASSOCIATIONS) ----- */}
          <div className="tab-pane fade show active" id="setup-pane" role="tabpanel">
            <div className="row g-4">
              <div className="col-lg-4">
                <h5>1. Manage Teams</h5>
                <TeamManager teams={teams} onDataChange={onDataChange} />
              </div>
              <div className="col-lg-4">
                <h5>2. Manage Categories</h5>
                <CategoryManager 
                  categories={categories} 
                  teams={teams} 
                  onDataChange={onDataChange} 
                />
              </div>
              <div className="col-lg-4">
                <h5>3. Manage Client-Team Associations</h5>
                <ClientTeamAssociationManager 
                  configs={configs}
                  teams={teams}
                />
              </div>
            </div>
          </div>

          {/* ----- TAB 2: DISCOVER & ASSIGN ----- */}
          <div className="tab-pane fade" id="discover-pane" role="tabpanel">
            <RuleDiscoveryManager 
              configs={configs}
              categories={categories}
              onDataChange={onDataChange}
            />
          </div>
          
          {/* ----- TAB 3: MANAGE EXISTING ----- */}
          <div className="tab-pane fade" id="manage-rules-pane" role="tabpanel">
            <RuleManager 
              configs={configs}
              categories={categories}
              onDataChange={onDataChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategorizationManager;
