/**
 * Safely retrieves a value from a claim object using the current column mappings.
 * @param {object} rawClaim The raw claim data object from the spreadsheet.
 * @param {string} standardKey The standard field key (e.g., 'claimId').
 * @param {object} mappings The client's column mappings.
 * @returns {*} The value from the claim, or undefined if not found.
 */
const getVal = (rawClaim, standardKey, mappings) => {
  const mappedKey = mappings[standardKey];
  return mappedKey && rawClaim[mappedKey] !== undefined ? rawClaim[mappedKey] : undefined;
};

/**
 * Calculates a priority score for a claim to rank it in the work queue.
 * @param {object} claim The processed claim object.
 * @param {object} mappings The client's column mappings.
 * @returns {number} The calculated priority score.
 */
const calculatePriorityScore = (claim, mappings) => {
  const totalCharges = parseFloat(getVal(claim.original, 'totalCharges', mappings) || 0);
  const age = parseInt(claim.age || 0, 10);
  let score = (totalCharges / 500) + (age * 1.5);
  if (claim.status === 'DENY') {
    score += 100;
  }
  return Math.round(score);
};

/**
 * Dynamically determines a claim's category based on client-specific rules.
 * @param {object} rawClaim The raw claim data object.
 * @param {object} mappings The client's column mappings.
 * @param {Map<string, object>} editRulesMap - A Map of edit text to rule details.
 * @param {Array<[string, object]>} sortedNoteRules - An array of [keyword, rule] pairs, sorted by length.
 * @returns {object} An object containing category information.
 */
const getClaimCategory = (rawClaim, mappings, editRulesMap, sortedNoteRules) => {
  const notes = (getVal(rawClaim, 'notes', mappings) || '').toLowerCase();
  const edit = getVal(rawClaim, 'edit', mappings);

  // 1. Check for an exact match in edit rules (most efficient)
  if (edit && editRulesMap.has(edit)) {
    return { ...editRulesMap.get(edit), source: 'Edit Rule' };
  }

  // 2. Check for keywords in note rules (sorted by length for specificity)
  if (notes) {
    for (const [keyword, rule] of sortedNoteRules) {
      if (notes.includes(keyword)) {
        return { ...rule, source: 'Note Rule' };
      }
    }
  }

  // 3. Default category if no rules match
  return { category: 'Needs Triage', source: 'Default', team_name: 'Needs Assignment', send_to_l1_monitor: false };
};

/**
 * Analyzes and processes the raw claims data from the uploaded file.
 * @param {Array<object>} rawData The array of raw claim objects from the spreadsheet.
 * @param {object} mappings The client's column mappings.
 * @param {object} clientRules The client's edit and note rules.
 * @returns {{claims: Array<object>, metrics: object}} Processed claims and aggregated metrics.
 */
function analyzeAndProcessClaims(rawData, mappings, clientRules) {
  const metrics = { totalClaims: 0, totalNetPayment: 0, claimsByStatus: {} };
  const actionableStates = ['PEND', 'ONHOLD', 'MANAGEMENTREVIEW'];

  // Pre-process rules for efficient lookups
  const editRulesMap = new Map(clientRules.editRules.map(r => [r.text, r]));
  const sortedNoteRules = clientRules.noteRules
    .map(r => [r.text.toLowerCase(), r])
    .sort((a, b) => b[0].length - a[0].length); // Sort by keyword length, descending

  const claims = rawData.map(rawClaim => {
    const processedClaim = {
      claimId: getVal(rawClaim, 'claimId', mappings) || 'N/A',
      state: String(getVal(rawClaim, 'state', mappings) || 'UNKNOWN').toUpperCase().trim(),
      status: String(getVal(rawClaim, 'status', mappings) || 'UNKNOWN').toUpperCase().trim(),
      age: parseInt(getVal(rawClaim, 'age', mappings) || 0, 10),
      netPayment: parseFloat(getVal(rawClaim, 'netPayment', mappings) || 0),
      providerName: getVal(rawClaim, 'providerName', mappings) || 'Unknown',
      original: rawClaim, // Keep a reference to the original raw data
    };

    // Calculate metrics
    metrics.totalClaims++;
    if (!isNaN(processedClaim.netPayment)) {
      metrics.totalNetPayment += processedClaim.netPayment;
    }
    metrics.claimsByStatus[processedClaim.status] = (metrics.claimsByStatus[processedClaim.status] || 0) + 1;
    
    // Determine if the claim is actionable and apply categorization
    processedClaim.isActionable = actionableStates.includes(processedClaim.state);
    if (processedClaim.isActionable) {
      const categoryInfo = getClaimCategory(rawClaim, mappings, editRulesMap, sortedNoteRules);
      Object.assign(processedClaim, categoryInfo);
      processedClaim.priorityScore = calculatePriorityScore(processedClaim, mappings);
    } else {
      processedClaim.category = 'N/A';
      processedClaim.team_name = 'N/A';
      processedClaim.priorityScore = -1;
    }
    
    return processedClaim;
  });

  return { claims, metrics };
}

export const claimService = {
  analyzeAndProcessClaims,
};
