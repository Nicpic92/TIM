import React from 'react';

/**
 * Renders a table of uncategorized items with dropdowns for category assignment.
 * @param {object} props
 * @param {string} props.title - The title to display above the table.
 * @param {Array<{text: string, category_id: string}>} props.items - The uncategorized items to display.
 * @param {Array} props.categories - The list of all available categories for the dropdown.
 * @param {Function} props.onCategoryChange - Callback when a category is selected for an item.
 * @param {string} [props.className] - Optional additional CSS classes for the container div.
 */
function UncategorizedRulesTable({ title, items, categories, onCategoryChange, className = '' }) {
  if (items.length === 0) {
    return null; // Don't render anything if there are no items
  }

  // Group categories by team name for the dropdown
  const groupedCategories = categories.reduce((acc, cat) => {
    const teamName = cat.team_name || 'Unassigned';
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(cat);
    return acc;
  }, {});

  return (
    <div className={className}>
      <h6>{title} ({items.length})</h6>
      <div className="table-responsive-sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="table table-sm table-bordered">
          <thead className="table-light">
            <tr>
              <th>Item Text</th>
              <th>Assign to Category</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span title={item.text}>{item.text}</span>
                </td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={item.category_id}
                    onChange={(e) => onCategoryChange(index, e.target.value)}
                  >
                    <option value="">Select a category...</option>
                    {Object.keys(groupedCategories).sort().map(teamName => (
                      <optgroup key={teamName} label={teamName}>
                        {groupedCategories[teamName].map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UncategorizedRulesTable;
