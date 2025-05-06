#!/usr/bin/env node

/**
 * MCP Server for interacting with the BlazeSQL Natural Language Query API.
 * Exposes the BlazeSQL query functionality as an MCP tool using McpServer.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"; // Reverted import path
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; // Reverted import path
import 'dotenv/config'; // Load environment variables from .env file
import { queryBlazeSQL, BlazeSQLResponse } from './blazesql.js'; // Import the function and types
import { z } from "zod"; // Import Zod for schema validation

// --- API Key Loading ---
const apiKey = process.env.BLAZE_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: BLAZE_API_KEY environment variable is not set.");
    console.error("Please create a .env file based on .env.example and add your API key.");
    process.exit(1); // Exit if the key is missing
}
console.error("API Key loaded successfully.");

// --- Server Initialization ---
const server = new McpServer( // Changed to McpServer
  {
    name: "BlazeSQL MCP Server",
    version: "0.2.0", // Updated version
  }
  // Capabilities are inferred by McpServer when tools are added
);

// --- Register Tool using server.tool() ---
server.tool(
    "blazesql_query", // Tool name
    {
        db_id: z.string().describe("The ID of the BlazeSQL database connection to query."),
        natural_language_request: z.string().describe("The query expressed in natural language (e.g., 'show me total users per city').")
    },
    // Tool handler function - TS should infer params type from raw shape now
    async (params) => {
        const { db_id, natural_language_request } = params;

        // Input validation is handled by Zod schema above

        console.error(`Executing BlazeSQL query for DB ID: ${db_id}`);
        console.error(`Natural Language Request: "${natural_language_request}"`);

        // Call the BlazeSQL API function - apiKey is guaranteed non-null here
        const result: BlazeSQLResponse = await queryBlazeSQL(db_id, natural_language_request, apiKey!);

        if (result.success) {
            console.error("BlazeSQL query successful. Returning structured results as formatted text.");

            // Format the output into a single text block with Markdown
            const outputText = `**Agent Response:**\n${result.agent_response}\n\n**Generated SQL:**\n\`\`\`sql\n${result.query ?? "-- No SQL query returned"}\n\`\`\`\n\n**Data Result (JSON):**\n\`\`\`json\n${JSON.stringify(result.data_result ?? {}, null, 2)}\n\`\`\`\n`;

            // Return a single text content block
            return {
                content: [
                    {
                        type: "text",
                        text: outputText
                    }
                ]
            };
        } else {
            // Handle API errors - Throwing an error is standard for tool failures
            console.error(`BlazeSQL API Error (Code ${result.error_code}): ${result.error}`);
            // Return error message as text content
            return {
                content: [
                    { type: "text", text: `BlazeSQL API Error: ${result.error}` }
                ],
                isError: true // Indicate it's an error response
            };
        }
    }
);

console.error(`Tool 'blazesql_query' registered using McpServer.`);

// --- Server Startup ---
console.error("BlazeSQL MCP Server configuring...");

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  console.error("Connecting transport...");
  await server.connect(transport);
  console.error("BlazeSQL MCP Server is running and connected via stdio.");
}

main().catch((error) => {
  console.error("Server encountered fatal error:", error);
  process.exit(1);
});
