import React from 'react';

/**
 * Renders the main content of the dashboard after a file has been processed.
 * @param {object} props
 * @param {Array} props.claimsData - The array of processed claims data.
 */
function DashboardContent({ claimsData }) {
  return (
    <div className="mt-4">
      <ul className="nav nav-tabs" id="mainTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="work-queue-tab" data-bs-toggle="tab" data-bs-target="#work-queue-pane" type="button" role="tab">
            Operational Work Queue
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="analytics-tab" data-bs-toggle="tab" data-bs-target="#analytics-pane" type="button" role="tab" disabled>
            Full Analytics Dashboard (coming soon)
          </button>
        </li>
      </ul>

      <div className="tab-content border border-top-0 p-3 bg-white">
        {/* ----- WORK QUEUE TAB ----- */}
        <div className="tab-pane fade show active" id="work-queue-pane" role="tabpanel">
          <div className="alert alert-info">
            Work Queue Table to be built here. Received {claimsData.length} total records.
          </div>
        </div>

        {/* ----- ANALYTICS TAB (Placeholder) ----- */}
        <div className="tab-pane fade" id="analytics-pane" role="tabpanel">
           <p>Advanced analytics charts and metrics will be built here.</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;
