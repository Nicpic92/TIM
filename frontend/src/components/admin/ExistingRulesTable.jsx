import React from 'react';

/**
 * Renders a table of existing rules, allowing for category changes and deletion.
 * @param {object} props
 * @param {string} props.title - The title to display for the table.
 * @param {Array} props.rules - The array of rule objects to display.
 * @param {Array} props.categories - The list of all categories for the dropdown.
 * @param {'edit'|'note'} props.ruleType - The type of rules being displayed.
 * @param {Function} props.onCategoryChange - Callback when a rule's category is changed.
 * @param {Function} props.onDeleteRule - Callback when a rule's delete button is clicked.
 */
function ExistingRulesTable({ title, rules, categories, ruleType, onCategoryChange, onDeleteRule }) {

  // Group categories by team name for the dropdown
  const groupedCategories = categories.reduce((acc, cat) => {
    const teamName = cat.team_name || 'Unassigned';
    if (!acc[teamName]) acc[teamName] = [];
    acc[teamName].push(cat);
    return acc;
  }, {});

  return (
    <div>
      <h6>{title} ({rules.length})</h6>
      <div className="table-responsive-sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="table table-sm table-bordered">
          <thead className="table-light">
            <tr>
              <th>Rule Text</th>
              <th>Assigned Category (Team)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.length > 0 ? (
              rules.map((rule, index) => (
                <tr key={rule.text}>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span title={rule.text}>{rule.text}</span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={rule.category_id}
                      onChange={(e) => onCategoryChange(ruleType, index, e.target.value)}
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
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-danger btn-sm py-0 px-1"
                      style={{ lineHeight: 1 }}
                      onClick={() => onDeleteRule(ruleType, rule.text)}
                      title={`Delete rule: ${rule.text}`}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-muted">No rules found for this client.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExistingRulesTable;
