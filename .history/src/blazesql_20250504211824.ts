import fetch from 'node-fetch'; // Using node-fetch for compatibility, could use native fetch in newer Node versions

const BLAZE_API_ENDPOINT = 'https://api.blazesql.com/natural_language_query_api';

// --- Interfaces based on BlazeSQL Docs ---

interface BlazeSQLRequest {
    db_id: string;
    natural_language_request: string;
    api_key: string;
}

interface BlazeSQLSuccessResponse {
    success: true;
    message: string;
    query: string;
    agent_response: string;
    data_result: {
        [columnName: string]: (string | number | boolean | null)[];
    };
}

interface BlazeSQLErrorResponse {
    success: false;
    error: string;
    error_code: number;
}

type BlazeSQLResponse = BlazeSQLSuccessResponse | BlazeSQLErrorResponse;

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

// Example usage (can be removed or adapted for the server)
/*
async function testQuery() {
    const apiKey = process.env.BLAZE_API_KEY; // Loaded via dotenv
    if (!apiKey) {
        console.error("API Key not found in environment variables.");
        return;
    }
    const dbId = "YOUR_DB_ID"; // Replace with a valid DB ID
    const request = "Show me the total number of users";

    if (dbId === "YOUR_DB_ID") {
        console.warn("Please replace 'YOUR_DB_ID' with an actual database ID for testing.");
        return;
    }


    console.log(`Sending query to BlazeSQL for DB (${dbId}): "${request}"`);
    const result = await queryBlazeSQL(dbId, request, apiKey);

    console.log("\n--- BlazeSQL API Response ---");
    if (result.success) {
        console.log("Success:", result.message);
        console.log("Generated SQL:", result.query);
        console.log("Agent Response:", result.agent_response);
        console.log("Data:", JSON.stringify(result.data_result, null, 2));
    } else {
        console.error("Error:", result.error);
        console.error("Error Code:", result.error_code);
    }
    console.log("---------------------------");

}

// Uncomment to run the test query directly
// import 'dotenv/config';
// testQuery();
*/ 