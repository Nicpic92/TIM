/**
 * Creates a structured JSON log entry and prints it to the console.
 * @param {'INFO' | 'ERROR' | 'WARN'} level The severity level of the log.
 * @param {string} functionName The name of the serverless function.
 * @param {string} message A human-readable message.
 * @param {object} [details={}] An optional object with relevant data.
 */
export const log = (level, functionName, message, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    functionName,
    message,
    details,
  };
  // Structured logs are easily searchable in Netlify's logging system.
  console.log(JSON.stringify(logEntry, null, 2));
};

/**
 * Creates a standardized successful JSON response object.
 * @param {number} statusCode The HTTP status code (e.g., 200, 201).
 * @param {object} body The JSON payload to send.
 * @returns {object} A Netlify Function response object.
 */
export const createJsonResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
};

/**
 * Creates a standardized error response object. Logs the detailed internal error
 * and returns a safe, generic message to the client.
 * @param {number} statusCode The HTTP status code (e.g., 400, 404, 500).
 * @param {string} publicMessage A safe message to display to the user.
 * @param {Error} error The actual error object caught in the catch block.
 * @param {string} functionName The name of the function where the error occurred.
 * @returns {object} A Netlify Function response object.
 */
export const createErrorResponse = (statusCode, publicMessage, error, functionName) => {
  // Log the detailed error for backend debugging.
  log('ERROR', functionName, error.message, {
    stack: error.stack,
    publicMessage,
  });

  // Return a generic, safe error response to the client.
  return {
    statusCode,
    headers: {
      // FIXED: Completed the Content-Type header value
      'Content-Type': 'application/json',
    },
    // FIXED: Added the required body structure for the error response
    body: JSON.stringify({ error: publicMessage }),
  };
};
