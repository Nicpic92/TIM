import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'client-rules.js';

// Schema for validating the query parameters.
const querySchema = z.object({
  type: z.enum(['edit', 'note']),
  config_id: z.string().regex(/^\d+$/, { message: 'config_id must be a positive integer.' }),
});

// Schema for a single rule object in a POST request.
const ruleSchema = z.object({
  text: z.string().min(1),
  category_id: z.number().positive(),
});

// Schema for the body of a POST request. Must be a non-empty array of rules.
const postSchema = z.array(ruleSchema).nonempty({
  message: 'Request body must be a non-empty array of rules.',
});

// Schema for the body of a DELETE request.
const deleteSchema = z.object({
  text: z.string().min(1),
});

/**
 * Main handler for the /client-rules endpoint.
 */
export async function handler(event, context) {
  // Validate query parameters first, as they are common to all methods.
  const queryValidation = querySchema.safeParse(event.queryStringParameters);
  if (!queryValidation.success) {
    const errorMessage = 'Invalid query parameters.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: queryValidation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: queryValidation.error.format() });
  }

  const { type, config_id } = queryValidation.data;
  const configId = parseInt(config_id, 10);

  // Determine table and column names based on the validated 'type'.
  const tableName = type === 'edit' ? 'claim_edit_rules' : 'claim_note_rules';
  const textField = type === 'edit' ? 'edit_text' : 'note_keyword';

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getRules(configId, tableName, textField);
      case 'POST':
        return await saveRules(event, configId, tableName, textField);
      case 'DELETE':
        return await deleteRule(event, configId, tableName, textField);
      default:
        return createJsonResponse(405, { error: 'Method Not Allowed' });
    }
  } catch (error) {
    return createErrorResponse(500, 'An internal server error occurred.', error, FUNCTION_NAME);
  }
}

async function getRules(configId, tableName, textField) {
  log('INFO', FUNCTION_NAME, `Fetching rules for config: ${configId}`, { table: tableName });
  const pool = getDbPool();
  const sql = `
    SELECT r.${textField} as text, r.category_id, c.category_name, t.team_name
    FROM ${tableName} r
    INNER JOIN claim_categories c ON r.category_id = c.id
    LEFT JOIN teams t ON c.team_id = t.id
    WHERE r.config_id = $1;
  `;
  const { rows } = await pool.query(sql, [configId]);
  return createJsonResponse(200, rows);
}

async function saveRules(event, configId, tableName, textField) {
  log('INFO', FUNCTION_NAME, `Saving rules for config: ${configId}`, { table: tableName });
  const body = JSON.parse(event.body);
  const validation = postSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid body for saving rules.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const rules = validation.data;
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    log('INFO', FUNCTION_NAME, `Transaction started for config: ${configId}`);

    for (const rule of rules) {
      // Use an "upsert" logic: UPDATE if the rule exists, INSERT if not.
      const upsertSql = `
        INSERT INTO ${tableName} (config_id, ${textField}, category_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (config_id, ${textField})
        DO UPDATE SET category_id = EXCLUDED.category_id, last_seen = CURRENT_TIMESTAMP;
      `;
      await client.query(upsertSql, [configId, rule.text, rule.category_id]);
    }

    await client.query('COMMIT');
    log('INFO', FUNCTION_NAME, `Transaction COMMITTED for config: ${configId}`);
    return createJsonResponse(201, { message: 'Rules saved successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    log('ERROR', FUNCTION_NAME, `Transaction ROLLED BACK for config: ${configId}`, { errorMessage: error.message });
    // Rethrow the error to be caught by the main handler, which will format the 500 response.
    throw error;
  } finally {
    // This is critical to prevent connection leaks.
    client.release();
  }
}

async function deleteRule(event, configId, tableName, textField) {
  log('INFO', FUNCTION_NAME, `Deleting rule for config: ${configId}`, { table: tableName });
  const body = JSON.parse(event.body);
  const validation = deleteSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid body for deleting a rule.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const { text } = validation.data;
  const pool = getDbPool();
  const sql = `DELETE FROM ${tableName} WHERE config_id = $1 AND ${textField} = $2;`;
  const result = await pool.query(sql, [configId, text]);
  
  if (result.rowCount === 0) {
    return createErrorResponse(404, `Rule not found for the given config.`, new Error('Rule Not Found'), FUNCTION_NAME);
  }

  return createJsonResponse(200, { message: 'Rule deleted successfully.' });
}
