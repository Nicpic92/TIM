import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'get-config.js';

// Schema for validating the 'id' query parameter.
const querySchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'ID must be a positive integer.' }),
});

/**
 * Main handler for the /get-config endpoint.
 * Fetches the `config_data` JSON for a single specified configuration ID.
 */
export async function handler(event, context) {
  // This endpoint only supports GET requests.
  if (event.httpMethod !== 'GET') {
    return createJsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const queryValidation = querySchema.safeParse(event.queryStringParameters);
    if (!queryValidation.success) {
      const errorMessage = 'Invalid or missing configuration ID.';
      log('WARN', FUNCTION_NAME, errorMessage, { errors: queryValidation.error.issues });
      return createJsonResponse(400, { error: errorMessage, details: queryValidation.error.format() });
    }

    const configId = parseInt(queryValidation.data.id, 10);
    log('INFO', FUNCTION_NAME, `Fetching config_data for ID: ${configId}`);

    const pool = getDbPool();
    const sql = 'SELECT config_data FROM column_configurations WHERE id = $1;';
    const { rows } = await pool.query(sql, [configId]);

    // If no row is found, it's a 404 Not Found error.
    if (rows.length === 0) {
      return createErrorResponse(404, `Configuration with id ${configId} not found.`, new Error('Not Found'), FUNCTION_NAME);
    }

    const configData = rows[0].config_data || {};
    log('INFO', FUNCTION_NAME, `Successfully fetched configuration for id: ${configId}`);

    // The body of the response is the JSON object itself, not a string.
    return createJsonResponse(200, configData);

  } catch (error) {
    return createErrorResponse(500, 'Failed to fetch configuration data.', error, FUNCTION_NAME);
  }
}
