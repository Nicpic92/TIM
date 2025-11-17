import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'configurations.js';

// Reusable schema for validating a numeric ID from a query string.
const idSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'ID must be a positive integer.' }),
});

// Validation schema for the body of POST and PUT requests.
const configSchema = z.object({
  config_name: z.string().min(1, { message: 'Configuration name cannot be empty.' }),
  // Ensures config_data is a valid object.
  config_data: z.record(z.any()).refine(val => val !== null && typeof val === 'object' && !Array.isArray(val), {
    message: 'config_data must be a valid JSON object.'
  }),
});

/**
 * Main handler for the /configurations endpoint.
 */
export async function handler(event, context) {
  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getConfigs();
      case 'POST':
        return await createConfig(event);
      case 'PUT':
        return await updateConfig(event);
      case 'DELETE':
        return await deleteConfig(event);
      default:
        return createJsonResponse(405, { error: 'Method Not Allowed' });
    }
  } catch (error) {
    return createErrorResponse(500, 'An internal server error occurred.', error, FUNCTION_NAME);
  }
}

/**
 * Handles GET requests to fetch all configurations.
 */
async function getConfigs() {
  log('INFO', FUNCTION_NAME, 'Received request to get all configurations.');
  const pool = getDbPool();
  const { rows } = await pool.query('SELECT id, config_name, config_data FROM column_configurations ORDER BY config_name;');
  log('INFO', FUNCTION_NAME, `Successfully fetched ${rows.length} configurations.`);
  return createJsonResponse(200, rows);
}

/**
 * Handles POST requests to create a new configuration.
 */
async function createConfig(event) {
  log('INFO', FUNCTION_NAME, 'Received request to create a new configuration.');
  
  const body = JSON.parse(event.body);
  const validation = configSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid input for creating a configuration.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const { config_name, config_data } = validation.data;
  const pool = getDbPool();
  const sql = 'INSERT INTO column_configurations (config_name, config_data) VALUES ($1, $2) RETURNING *;';
  const { rows } = await pool.query(sql, [config_name, config_data]);

  log('INFO', FUNCTION_NAME, `Successfully created configuration with ID: ${rows[0].id}.`);
  return createJsonResponse(201, rows[0]);
}

/**
 * Handles PUT requests to update an existing configuration.
 */
async function updateConfig(event) {
  log('INFO', FUNCTION_NAME, 'Received request to update a configuration.');
  
  const { id } = event.queryStringParameters || {};
  const idValidation = idSchema.safeParse({ id });

  if (!idValidation.success) {
    const errorMessage = 'Invalid or missing configuration ID for update.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: idValidation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: idValidation.error.format() });
  }

  const body = JSON.parse(event.body);
  const bodyValidation = configSchema.safeParse(body);

  if (!bodyValidation.success) {
    const errorMessage = 'Invalid input for updating a configuration.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: bodyValidation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: bodyValidation.error.format() });
  }

  const configId = parseInt(idValidation.data.id, 10);
  const { config_name, config_data } = bodyValidation.data;
  const pool = getDbPool();
  const sql = 'UPDATE column_configurations SET config_name = $1, config_data = $2, last_updated = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *;';
  const { rows } = await pool.query(sql, [config_name, config_data, configId]);

  if (rows.length === 0) {
    return createErrorResponse(404, `Configuration with ID ${configId} not found.`, new Error('Not Found'), FUNCTION_NAME);
  }

  log('INFO', FUNCTION_NAME, `Successfully updated configuration with ID: ${configId}.`);
  return createJsonResponse(200, rows[0]);
}

/**
 * Handles DELETE requests to remove a configuration.
 */
async function deleteConfig(event) {
  log('INFO', FUNCTION_NAME, 'Received request to delete a configuration.');

  const { id } = event.queryStringParameters || {};
  const validation = idSchema.safeParse({ id });

  if (!validation.success) {
    const errorMessage = 'Invalid or missing configuration ID for deletion.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }
  
  const configId = parseInt(validation.data.id, 10);
  const pool = getDbPool();
  
  // Note: The database schema should be set up with ON DELETE CASCADE to also remove
  // all associated rules and team associations when a configuration is deleted.
  const result = await pool.query('DELETE FROM column_configurations WHERE id = $1;', [configId]);
  
  if (result.rowCount === 0) {
      return createErrorResponse(404, `Configuration with ID ${configId} not found.`, new Error('Not Found'), FUNCTION_NAME);
  }

  log('INFO', FUNCTION_NAME, `Successfully deleted configuration with ID: ${configId}.`);
  return createJsonResponse(200, { message: `Configuration ${configId} deleted successfully.` });
}
