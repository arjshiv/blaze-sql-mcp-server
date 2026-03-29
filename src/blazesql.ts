import { z } from "zod";

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

const blazeSQLSuccessResponseSchema = z.object({
    success: z.literal(true),
    message: z.string().optional(),
    query: z.string().optional(),
    agent_response: z.string().default("BlazeSQL returned no natural-language summary."),
    data_result: z.unknown().optional(),
});

const blazeSQLErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.string().default("BlazeSQL returned an unknown error."),
    error_code: z.number().int().nonnegative().default(500),
});

function parseBlazeSQLResponse(
    payload: unknown,
    statusCode: number,
): BlazeSQLResponse {
    const successResult = blazeSQLSuccessResponseSchema.safeParse(payload);
    if (successResult.success) {
        return successResult.data as BlazeSQLSuccessResponse;
    }

    const errorResult = blazeSQLErrorResponseSchema.safeParse(payload);
    if (errorResult.success) {
        return errorResult.data;
    }

    return {
        success: false,
        error: "BlazeSQL returned an unexpected response shape.",
        error_code: statusCode,
    };
}

async function parseJsonResponse(response: Response): Promise<BlazeSQLResponse> {
    const rawBody = await response.text();

    if (!rawBody.trim()) {
        return {
            success: false,
            error: "BlazeSQL returned an empty response body.",
            error_code: response.status || 502,
        };
    }

    try {
        return parseBlazeSQLResponse(JSON.parse(rawBody), response.status || 200);
    } catch {
        return {
            success: false,
            error: "BlazeSQL returned a non-JSON response body.",
            error_code: response.status || 502,
        };
    }
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
            const parsedError = await parseJsonResponse(response);
            if (!parsedError.success) {
                return {
                    success: false,
                    error: parsedError.error || `HTTP error! status: ${response.status}`,
                    error_code: parsedError.error_code || response.status,
                };
            }

            return {
                success: false,
                error: `HTTP error! status: ${response.status}`,
                error_code: response.status,
            };
        }

        return await parseJsonResponse(response);

    } catch (error) {
        const isTimeout =
            error instanceof Error &&
            (error.name === "TimeoutError" || error.name === "AbortError");

         return { // Return a structured error matching BlazeSQLErrorResponse
             success: false,
             error: isTimeout
                ? `BlazeSQL request timed out after ${options.requestTimeoutMs}ms.`
                : error instanceof Error
                    ? error.message
                    : 'An unknown error occurred during the API request.',
             error_code: isTimeout ? 408 : 500, // Generic internal/network error
         };
    }
}
