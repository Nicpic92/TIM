import { z } from 'zod';
import { getDbPool } from './utils/database.js';
import { log, createJsonResponse, createErrorResponse } from './utils/apiUtils.js';

const FUNCTION_NAME = 'categories.js';

// Validation schema for creating a new category.
const categorySchema = z.object({
  category_name: z.string().min(1, { message: 'Category name cannot be empty.' }),
  team_id: z.number().positive({ message: 'A valid team ID is required.' }),
  send_to_l1_monitor: z.boolean().optional().default(false),
});

// Validation schema for deleting a category.
const deleteSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'ID must be a positive integer.' }),
});

/**
 * Main handler for the /categories endpoint.
 */
export async function handler(event, context) {
  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getCategories();
      case 'POST':
        return await createCategory(event);
      case 'DELETE':
        return await deleteCategory(event);
      default:
        return createJsonResponse(405, { error: 'Method Not Allowed' });
    }
  } catch (error) {
    return createErrorResponse(500, 'An internal server error occurred.', error, FUNCTION_NAME);
  }
}

/**
 * Handles GET requests to fetch all categories, joined with their team names.
 */
async function getCategories() {
  log('INFO', FUNCTION_NAME, 'Received request to get all categories.');
  const pool = getDbPool();
  // The LEFT JOIN is important for the frontend to display the team name.
  const sql = `
    SELECT c.id, c.category_name, c.team_id, c.send_to_l1_monitor, t.team_name
    FROM claim_categories c
    LEFT JOIN teams t ON c.team_id = t.id
    ORDER BY t.team_name, c.category_name;
  `;
  const { rows } = await pool.query(sql);
  log('INFO', FUNCTION_NAME, `Successfully fetched ${rows.length} categories.`);
  return createJsonResponse(200, rows);
}

/**
 * Handles POST requests to create a new category.
 */
async function createCategory(event) {
  log('INFO', FUNCTION_NAME, 'Received request to create a new category.');

  const body = JSON.parse(event.body);
  const validation = categorySchema.safeParse(body);

  if (!validation.success) {
    const errorMessage = 'Invalid input for creating a category.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }

  const { category_name, team_id, send_to_l1_monitor } = validation.data;
  const pool = getDbPool();
  const sql = 'INSERT INTO claim_categories (category_name, team_id, send_to_l1_monitor) VALUES ($1, $2, $3) RETURNING *;';
  const { rows } = await pool.query(sql, [category_name, team_id, send_to_l1_monitor]);

  log('INFO', FUNCTION_NAME, `Successfully created category with ID: ${rows[0].id}.`);
  return createJsonResponse(201, rows[0]);
}

/**
 * Handles DELETE requests to remove a category.
 */
async function deleteCategory(event) {
  log('INFO', FUNCTION_NAME, 'Received request to delete a category.');

  const { id } = event.queryStringParameters || {};
  const validation = deleteSchema.safeParse({ id });

  if (!validation.success) {
    const errorMessage = 'Invalid or missing category ID for deletion.';
    log('WARN', FUNCTION_NAME, errorMessage, { errors: validation.error.issues });
    return createJsonResponse(400, { error: errorMessage, details: validation.error.format() });
  }
  
  const categoryId = parseInt(validation.data.id, 10);
  const pool = getDbPool();
  
  // Note: The database schema should have ON DELETE CASCADE on the rules tables
  // to automatically clean up any rules associated with this category.
  await pool.query('DELETE FROM claim_categories WHERE id = $1;', [categoryId]);

  log('INFO', FUNCTION_NAME, `Successfully deleted category with ID: ${categoryId}.`);
  return createJsonResponse(200, { message: `Category ${categoryId} deleted successfully.` });
}
