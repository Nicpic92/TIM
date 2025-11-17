import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'teams.js';

// Define the validation schema for creating a new team.
const teamSchema = z.object({
  team_name: z.string().min(2, { message: 'Team name must be at least 2 characters long.' }),
});

// Define the validation schema for deleting a team.
const deleteSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'ID must be a positive integer.' }),
});

/**
 * Main handler for the /teams endpoint.
 */
export async function handler(event, context) {
  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getTeams();
      case 'POST':
        return await createTeam(event);
      case 'DELETE':
        return await deleteTeam(event);
      default:
        return createJsonResponse(405, { error: 'Method Not Allowed' });
    }
  } catch (error) {
    return createErrorResponse(500, 'An internal server error occurred.', error, FUNCTION_NAME);
  }
}

/**
 * Handles GET requests to fetch all teams.
 */
async function getTeams() {
  log('INFO', FUNCTION_NAME, 'Received request to get all teams.');
  const pool = getDbPool();
  const { rows } = await pool.query('SELECT * FROM teams ORDER BY team_name;');
  log('INFO', FUNCTION_NAME, `Successfully fetched ${rows.length} teams.`);
  return createJsonResponse(200, rows);
}

/**
 * Handles POST requests to create a new team.
 */
async function createTeam(event) {
  log('INFO', FUNCTION_NAME, 'Received request to create a new team.');
  
  const body = JSON.parse(event.body);
  const validation = teamSchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid input for creating a team.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const { team_name } = validation.data;
  const pool = getDbPool();
  const sql = 'INSERT INTO teams (team_name) VALUES ($1) RETURNING *;';
  const { rows } = await pool.query(sql, [team_name]);
  
  log('INFO', FUNCTION_NAME, `Successfully created team with ID: ${rows[0].id}.`);
  return createJsonResponse(201, rows[0]);
}

/**
 * Handles DELETE requests to remove a team.
 */
async function deleteTeam(event) {
  log('INFO', FUNCTION_NAME, 'Received request to delete a team.');

  const { id } = event.queryStringParameters || {};
  const validation = deleteSchema.safeParse({ id });

  if (!validation.success) {
    const errorMessage = 'Invalid or missing team ID for deletion.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }
  
  const teamId = parseInt(validation.data.id, 10);
  const pool = getDbPool();
  
  // Note: We will add ON DELETE CASCADE to the database schema
  // to handle deleting associated categories automatically.
  await pool.query('DELETE FROM teams WHERE id = $1;', [teamId]);
  
  log('INFO', FUNCTION_NAME, `Successfully deleted team with ID: ${teamId}.`);
  return createJsonResponse(200, { message: `Team ${teamId} deleted successfully.` });
}
