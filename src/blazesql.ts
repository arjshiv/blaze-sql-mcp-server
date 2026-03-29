import fetch from 'node-fetch'; // Using node-fetch for compatibility, could use native fetch in newer Node versions

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

export interface BlazeSQLClientOptions {
    endpoint: string;
    requestTimeoutMs: number;
}

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
    apiKey: string,
    options: BlazeSQLClientOptions
): Promise<BlazeSQLResponse> {
    if (!apiKey) {
        throw new Error('BlazeSQL API key is missing. Ensure BLAZE_API_KEY is set in your environment.');
    }

    const requestBody: BlazeSQLRequest = {
        db_id: dbId,
        natural_language_request: naturalLanguageRequest,
        api_key: apiKey,
    };

    try {
        const response = await fetch(options.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(options.requestTimeoutMs),
            body: JSON.stringify(requestBody),
        });


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

    } catch (error) {
        console.error('Error querying BlazeSQL:', error);
         return { // Return a structured error matching BlazeSQLErrorResponse
             success: false,
             error: error instanceof Error ? error.message : 'An unknown error occurred during the API request.',
             error_code: 500, // Generic internal/network error
         };
    }
}
