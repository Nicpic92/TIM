import React from 'react';

// Import child components
import TeamManager from './TeamManager';
import CategoryManager from './CategoryManager';
import ClientTeamAssociationManager from './ClientTeamAssociationManager';

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
            <button className="nav-link active" id="manage-teams-cats-tab" data-bs-toggle="tab" data-bs-target="#manage-teams-cats-pane" type="button" role="tab">
              Setup
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="discover-tab" data-bs-toggle="tab" data-bs-target="#discover-pane" type="button" role="tab" disabled>
              Discover & Assign Rules (coming soon)
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="manage-rules-tab" data-bs-toggle="tab" data-bs-target="#manage-rules-pane" type="button" role="tab" disabled>
              Manage Existing Rules (coming soon)
            </button>
          </li>
        </ul>

        <div className="tab-content pt-3">
          {/* ----- TAB 1: SETUP (TEAMS, CATEGORIES, ASSOCIATIONS) ----- */}
          <div className="tab-pane fade show active" id="manage-teams-cats-pane" role="tabpanel">
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

          {/* ----- TAB 2: DISCOVER & ASSIGN (Placeholder) ----- */}
          <div className="tab-pane fade" id="discover-pane" role="tabpanel">
            <p>UI for discovering new rules will be built here.</p>
          </div>
          
          {/* ----- TAB 3: MANAGE EXISTING (Placeholder) ----- */}
          <div className="tab-pane fade" id="manage-rules-pane" role="tabpanel">
            <p>UI for managing existing rules will be built here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategorizationManager;```

---

### ✅ Milestone: Setup Tab Complete

With this change, the first tab of our `CategorizationManager` is now functionally complete. Users can manage teams, manage categories, and define the relationships between clients and teams, all from one screen.

The next major step is to build the functionality for the second tab: **"Discover, Assign & Triage"**. This is the core workflow for teaching the system new rules. We will start by creating the main component for this tab.

Let me know when you're ready to proceed.
