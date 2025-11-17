import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'get-categorization-config.js';

/**
 * Main handler for the /get-categorization-config endpoint.
 * Fetches all edit and note rules across all clients.
 */
export async function handler(event, context) {
  // This endpoint only supports GET requests.
  if (event.httpMethod !== 'GET') {
    return createJsonResponse(405, { error: 'Method Not Allowed' });
  }
  
  log('INFO', FUNCTION_NAME, 'Received request to fetch all categorization rules.');

  try {
    const pool = getDbPool();

    const editRulesQuery = `
      SELECT r.config_id, r.edit_text, c.category_name, t.id as team_id, t.team_name, c.send_to_l1_monitor
      FROM claim_edit_rules r
      JOIN claim_categories c ON r.category_id = c.id
      LEFT JOIN teams t ON c.team_id = t.id;
    `;
    const noteRulesQuery = `
      SELECT r.config_id, r.note_keyword as note_text, c.category_name, t.id as team_id, t.team_name, c.send_to_l1_monitor
      FROM claim_note_rules r
      JOIN claim_categories c ON r.category_id = c.id
      LEFT JOIN teams t ON c.team_id = t.id;
    `;

    // Run queries in parallel for efficiency.
    const [editRulesResult, noteRulesResult] = await Promise.all([
      pool.query(editRulesQuery),
      pool.query(noteRulesQuery),
    ]);

    const config = {
      editRules: editRulesResult.rows,
      noteRules: noteRulesResult.rows,
    };

    log('INFO', FUNCTION_NAME, 'Successfully fetched all categorization rules.', {
      editRuleCount: config.editRules.length,
      noteRuleCount: config.noteRules.length,
    });

    return createJsonResponse(200, config);
  } catch (error) {
    return createErrorResponse(500, 'Failed to fetch categorization configuration.', error, FUNCTION_NAME);
  }
}
