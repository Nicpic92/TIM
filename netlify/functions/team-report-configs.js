import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'team-report-configs.js';

// Reusable schema for validating a numeric ID from a query string.
const idSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'ID must be a positive integer.' }),
});

// Validation schema for the body of POST and PUT requests.
const reportConfigSchema = z.object({
  team_id: z.number().positive(),
  category_id: z.number().positive(),
  // Ensures report_config_data is a valid object.
  report_config_data: z.record(z.any()).refine(val => val !== null && typeof val === 'object' && !Array.isArray(val), {
    message: 'report_config_data must be a valid JSON object.'
  }),
});

/**
 * Main handler for the /team-report-configs endpoint.
 */
export async function handler(event, context) {
  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getReportConfigs();
      case 'POST':
        return await createReportConfig(event);
      case 'PUT':
        return await updateReportConfig(event);
      case 'DELETE':
        return await deleteReportConfig(event);
      default:
        return createJsonResponse(405, { error: 'Method Not Allowed' });
    }
  } catch (error) {
    return createErrorResponse(500, 'An internal server error occurred.', error, FUNCTION_NAME);
  }
}

async function getReportConfigs() {
  log('INFO', FUNCTION_NAME, 'Received request to get all team report configs.');
  const pool = getDbPool();
  const { rows } = await pool.query('SELECT * FROM team_report_configurations ORDER BY team_id, category_id;');
  log('INFO', FUNCTION_NAME, `Successfully fetched ${rows.length} report configs.`);
  return createJsonResponse(200, rows);
}

async function createReportConfig(event) {
  log('INFO', FUNCTION_NAME, 'Received request to create a team report config.');
  
  const body = JSON.parse(event.body);
  const validation = reportConfigSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid input for creating a report config.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const { team_id, category_id, report_config_data } = validation.data;
  const pool = getDbPool();
  const sql = `
    INSERT INTO team_report_configurations (team_id, category_id, report_config_data)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [team_id, category_id, report_config_data]);

  log('INFO', FUNCTION_NAME, `Successfully created report config with ID: ${rows[0].id}.`);
  return createJsonResponse(201, rows[0]);
}

async function updateReportConfig(event) {
  log('INFO', FUNCTION_NAME, 'Received request to update a team report config.');
  
  const { id } = event.queryStringParameters || {};
  const idValidation = idSchema.safeParse({ id });

  if (!idValidation.success) {
    const errorMessage = 'Invalid or missing report config ID for update.';
    return createJsonResponse(400, { error: errorMessage, details: idValidation.error.format() });
  }

  const body = JSON.parse(event.body);
  const bodyValidation = reportConfigSchema.safeParse(body);

  if (!bodyValidation.success) {
    const errorMessage = 'Invalid input for updating a report config.';
    return createJsonResponse(400, { error: errorMessage, details: bodyValidation.error.format() });
  }

  const configId = parseInt(idValidation.data.id, 10);
  const { team_id, category_id, report_config_data } = bodyValidation.data;
  const pool = getDbPool();
  const sql = `
    UPDATE team_report_configurations 
    SET team_id = $1, category_id = $2, report_config_data = $3, last_updated = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [team_id, category_id, report_config_data, configId]);

  if (rows.length === 0) {
    return createErrorResponse(404, `Report config with ID ${configId} not found.`, new Error('Not Found'), FUNCTION_NAME);
  }

  log('INFO', FUNCTION_NAME, `Successfully updated report config with ID: ${configId}.`);
  return createJsonResponse(200, rows[0]);
}

async function deleteReportConfig(event) {
  log('INFO', FUNCTION_NAME, 'Received request to delete a team report config.');

  const { id } = event.queryStringParameters || {};
  const validation = idSchema.safeParse({ id });

  if (!validation.success) {
    const errorMessage = 'Invalid or missing report config ID for deletion.';
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }
  
  const configId = parseInt(validation.data.id, 10);
  const pool = getDbPool();
  const result = await pool.query('DELETE FROM team_report_configurations WHERE id = $1;', [configId]);
  
  if (result.rowCount === 0) {
    return createErrorResponse(404, `Report config with ID ${configId} not found.`, new Error('Not Found'), FUNCTION_NAME);
  }

  log('INFO', FUNCTION_NAME, `Successfully deleted report config with ID: ${configId}.`);
  return createJsonResponse(200, { message: `Report config ${configId} deleted successfully.` });
}
