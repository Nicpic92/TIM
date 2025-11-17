import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'client-team-associations.js';

// Schema for validating a single config_id from a query string.
const querySchema = z.object({
  config_id: z.string().regex(/^\d+$/, { message: 'config_id must be a positive integer.' }),
});

// Schema for validating the body of a POST request.
const postSchema = z.object({
  config_id: z.number().positive(),
  // team_ids must be an array of positive numbers.
  team_ids: z.array(z.number().positive()),
});

/**
 * Main handler for the /client-team-associations endpoint.
 */
export async function handler(event, context) {
  try {
    switch (event.httpMethod) {
      case 'GET':
        // If a config_id is present, get associations for that specific client.
        if (event.queryStringParameters?.config_id) {
          return await getAssociations(event);
        }
        // Otherwise, get all associations.
        return await getAllAssociations();
      case 'POST':
        return await saveAssociations(event);
      default:
        return createJsonResponse(405, { error: 'Method Not Allowed' });
    }
  } catch (error) {
    return createErrorResponse(500, 'An internal server error occurred.', error, FUNCTION_NAME);
  }
}

async function getAllAssociations() {
  log('INFO', FUNCTION_NAME, 'Fetching all client-team associations.');
  const pool = getDbPool();
  const { rows } = await pool.query('SELECT config_id, team_id FROM client_team_associations;');
  return createJsonResponse(200, rows);
}

async function getAssociations(event) {
  const queryValidation = querySchema.safeParse(event.queryStringParameters);
  if (!queryValidation.success) {
    const errorMessage = 'Invalid config_id parameter.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: queryValidation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: queryValidation.error.format() });
  }

  const configId = parseInt(queryValidation.data.config_id, 10);
  log('INFO', FUNCTION_NAME, `Fetching associations for config_id: ${configId}`);
  const pool = getDbPool();
  const { rows } = await pool.query('SELECT team_id FROM client_team_associations WHERE config_id = $1;', [configId]);
  
  // Return a simple array of numbers, e.g., [1, 5, 12]
  return createJsonResponse(200, rows.map(r => r.team_id));
}

async function saveAssociations(event) {
  const body = JSON.parse(event.body);
  const validation = postSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid body for saving associations.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const { config_id, team_ids } = validation.data;
  log('INFO', FUNCTION_NAME, `Saving ${team_ids.length} associations for config_id: ${config_id}`);
  
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    log('INFO', FUNCTION_NAME, `Transaction started for config_id: ${config_id}`);

    // First, delete all existing associations for this client.
    await client.query('DELETE FROM client_team_associations WHERE config_id = $1;', [config_id]);

    // If there are new team_ids to associate, insert them.
    if (team_ids.length > 0) {
      // Use PostgreSQL's unnest function for an efficient bulk insert.
      const insertSql = `
        INSERT INTO client_team_associations (config_id, team_id)
        SELECT $1, unnest($2::int[]);
      `;
      await client.query(insertSql, [config_id, team_ids]);
    }

    await client.query('COMMIT');
    log('INFO', FUNCTION_NAME, `Transaction COMMITTED for config_id: ${config_id}`);
    return createJsonResponse(201, { message: 'Associations saved successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    log('ERROR', FUNCTION_NAME, `Transaction ROLLED BACK for config_id: ${config_id}`, { errorMessage: error.message });
    throw error;
  } finally {
    client.release();
  }
}
