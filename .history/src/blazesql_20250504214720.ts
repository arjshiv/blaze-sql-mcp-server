import fetch from 'node-fetch'; // Using node-fetch for compatibility, could use native fetch in newer Node versions

const BLAZE_API_ENDPOINT = 'https://api.blazesql.com/natural_language_query_api';

// --- Interfaces based on BlazeSQL Docs ---

export interface BlazeSQLRequest {
    db_id: string;
    natural_language_request: string;
    api_key: string;
}

export interface BlazeSQLSuccessResponse {
    success: true;
    message: string;
    query: string;
    agent_response: string;
    data_result: {
        [columnName: string]: (string | number | boolean | null)[];
    };
}

export interface BlazeSQLErrorResponse {
    success: false;
    error: string;
    error_code: number;
}

export type BlazeSQLResponse = BlazeSQLSuccessResponse | BlazeSQLErrorResponse;

// --- API Interaction Function ---

/**
 * Sends a natural language query to the BlazeSQL API.
 * @param dbId The ID of the database to query.
 * @param naturalLanguageRequest The query in natural language.
 * @param apiKey Your BlazeSQL API key.
 * @returns The response from the BlazeSQL API.
 * @throws Error if the network request fails.
 */
export async function queryBlazeSQL(
    dbId: string,
    naturalLanguageRequest: string,
    apiKey: string
): Promise<BlazeSQLResponse> {
    if (!apiKey) {
        throw new Error('BlazeSQL API key is missing. Ensure BLAZE_API_KEY is set in your environment.');
    }

    const requestBody: BlazeSQLRequest = {
        db_id: dbId,
        natural_language_request: naturalLanguageRequest,
        api_key: apiKey,
    };

    // --- Add Timeout Controller --- 
    const timeoutMilliseconds = 120000; // 2 minutes
    const signal = AbortSignal.timeout(timeoutMilliseconds);
    // --- End Timeout Controller --- 

    try {
        console.error(`Sending request to BlazeSQL with ${timeoutMilliseconds / 1000}s timeout...`); // Log timeout
        const response = await fetch(BLAZE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: signal // Pass the timeout signal here
        });

        console.error(`Response status: ${response.status}`);

        if (!response.ok) {
            // Attempt to parse error response from Blaze, otherwise throw generic error
            try {
                const errorData: BlazeSQLErrorResponse = await response.json() as BlazeSQLErrorResponse;
                 return { // Return a structured error matching BlazeSQLErrorResponse
                     success: false,
                     error: errorData.error || `HTTP error! status: ${response.status}`,
                     error_code: errorData.error_code || response.status,
                 };
            } catch (parseError) {
                 return { // Return a structured error matching BlazeSQLErrorResponse
                     success: false,
                     error: `HTTP error! status: ${response.status}. Failed to parse error response.`,
                     error_code: response.status,
                 };
            }
        }

        const data: BlazeSQLResponse = await response.json() as BlazeSQLResponse;
        return data;

    } catch (error: any) { // Add : any to check error name
        // Check if the error is due to the timeout
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
             console.error(`BlazeSQL request timed out after ${timeoutMilliseconds / 1000} seconds.`);
             return { // Return a structured error matching BlazeSQLErrorResponse
                 success: false,
                 error: `Request timed out after ${timeoutMilliseconds / 1000} seconds. The query might be too complex or the API might be slow.`,
                 error_code: 504, // Gateway Timeout
             };
        }
        // Handle other errors
        console.error('Error querying BlazeSQL:', error);
         return { // Return a structured error matching BlazeSQLErrorResponse
             success: false,
             error: error instanceof Error ? error.message : 'An unknown error occurred during the API request.',
             error_code: 500, // Generic internal/network error
         };
    }
}