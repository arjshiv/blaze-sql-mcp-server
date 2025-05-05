import fetch from 'node-fetch'; // Using node-fetch for compatibility, could use native fetch in newer Node versions
const BLAZE_API_ENDPOINT = 'https://api.blazesql.com/natural_language_query_api';
// --- API Interaction Function ---
/**
 * Sends a natural language query to the BlazeSQL API.
 * @param dbId The ID of the database to query.
 * @param naturalLanguageRequest The query in natural language.
 * @param apiKey Your BlazeSQL API key.
 * @returns The response from the BlazeSQL API.
 * @throws Error if the network request fails.
 */
export async function queryBlazeSQL(dbId, naturalLanguageRequest, apiKey) {
    if (!apiKey) {
        throw new Error('BlazeSQL API key is missing. Ensure BLAZE_API_KEY is set in your environment.');
    }
    const requestBody = {
        db_id: dbId,
        natural_language_request: naturalLanguageRequest,
        api_key: apiKey,
    };
    try {
        const response = await fetch(BLAZE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            // Attempt to parse error response from Blaze, otherwise throw generic error
            try {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.error || `HTTP error! status: ${response.status}`,
                    error_code: errorData.error_code || response.status,
                };
            }
            catch (parseError) {
                return {
                    success: false,
                    error: `HTTP error! status: ${response.status}. Failed to parse error response.`,
                    error_code: response.status,
                };
            }
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error querying BlazeSQL:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred during the API request.',
            error_code: 500, // Generic internal/network error
        };
    }
}
