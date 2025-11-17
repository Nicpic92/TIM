import { useState, useMemo } from 'react';

/**
 * An interactive and sortable table for displaying the operational work queue.
 * @param {object} props
 * @param {Array} props.claimsData - The array of all processed claims.
 */
function WorkQueueTable({ claimsData }) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'priorityScore', direction: 'descending' });

  // Memoize the list of unique categories for the filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = new Set(claimsData.filter(c => c.isActionable).map(c => c.category));
    return Array.from(categories).sort();
  }, [claimsData]);

  // Memoize the filtering and sorting logic for performance
  const sortedAndFilteredClaims = useMemo(() => {
    let filtered = claimsData.filter(c => c.isActionable);

    if (filterCategory !== 'all') {
      filtered = filtered.filter(c => c.category === filterCategory);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key] || 0;
        const valB = b[sortConfig.key] || 0;

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [claimsData, filterCategory, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  };

  return (
    <div>
      {/* Filter Controls */}
      <div className="card p-3 mb-3 bg-light border-0">
        <label htmlFor="categoryFilter" className="form-label fw-bold">
          Filter by Category
        </label>
        <select
          id="categoryFilter"
          className="form-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Actionable Categories ({claimsData.filter(c => c.isActionable).length})</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Work Queue Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead style={{ backgroundColor: '#005A9C', color: 'white' }}>
            <tr>
              <th onClick={() => requestSort('priorityScore')} style={{ cursor: 'pointer' }}>
                Priority <i className={`bi ${getSortIcon('priorityScore')}`}></i>
              </th>
              <th onClick={() => requestSort('category')} style={{ cursor: 'pointer' }}>
                Category <i className={`bi ${getSortIcon('category')}`}></i>
              </th>
              <th onClick={() => requestSort('team_name')} style={{ cursor: 'pointer' }}>
                Assigned Team <i className={`bi ${getSortIcon('team_name')}`}></i>
              </th>
              <th onClick={() => requestSort('claimId')} style={{ cursor: 'pointer' }}>
                Claim ID <i className={`bi ${getSortIcon('claimId')}`}></i>
              </th>
              <th onClick={() => requestSort('age')} style={{ cursor: 'pointer' }}>
                Age <i className={`bi ${getSortIcon('age')}`}></i>
              </th>
              <th onClick={() => requestSort('netPayment')} style={{ cursor: 'pointer' }}>
                Amount at Risk <i className={`bi ${getSortIcon('netPayment')}`}></i>
              </th>
              <th onClick={() => requestSort('providerName')} style={{ cursor: 'pointer' }}>
                Billing Provider <i className={`bi ${getSortIcon('providerName')}`}></i>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredClaims.map(claim => (
              <tr key={claim.claimId}>
                <td>{claim.priorityScore}</td>
                <td>{claim.category}</td>
                <td>{claim.team_name}</td>
                <td>{claim.claimId}</td>
                <td>{claim.age}</td>
                <td>${(claim.netPayment || 0).toFixed(2)}</td>
                <td>{claim.providerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkQueueTable;
