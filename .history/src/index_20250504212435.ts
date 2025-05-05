#!/usr/bin/env node

/**
 * MCP Server for interacting with the BlazeSQL Natural Language Query API.
 * Exposes the BlazeSQL query functionality as an MCP tool.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema, // Keep for potential future use (e.g., list DBs)
  ListToolsRequestSchema,
  ReadResourceRequestSchema, // Keep for potential future use
  ListPromptsRequestSchema,  // Keep for potential future use
  GetPromptRequestSchema,   // Keep for potential future use
  CallToolResultSchema, // Corrected type
} from "@modelcontextprotocol/sdk/types.js";
import 'dotenv/config'; // Load environment variables from .env file
import { queryBlazeSQL, BlazeSQLResponse } from './blazesql.js'; // Import the function and types

// --- API Key Loading ---
const apiKey = process.env.BLAZE_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: BLAZE_API_KEY environment variable is not set.");
    console.error("Please create a .env file based on .env.example and add your API key.");
    process.exit(1); // Exit if the key is missing
}
console.log("API Key loaded successfully.");

// --- Server Initialization ---
const server = new Server(
  {
    name: "BlazeSQL MCP Server", // Updated server name
    version: "0.1.0",
  },
  {
    capabilities: {
      // Define capabilities - currently only tools
      resources: {}, // Keep empty for now
      tools: {},
      prompts: {}, // Keep empty for now
    },
  }
);

// --- MCP Request Handlers ---

// Optional: Implement later if needed to list available databases as resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  console.warn("ListResourcesRequestSchema not implemented yet.");
  return { resources: [] };
});

// Optional: Implement later if needed
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  console.warn("ReadResourceRequestSchema not implemented yet.");
  throw new Error(`Resource reading not implemented.`);
});

/**
 * Handler that lists available tools.
 * Exposes a single "blazesql_query" tool.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "blazesql_query",
        description: "Executes a natural language query against a specified BlazeSQL database.",
        inputSchema: {
          type: "object",
          properties: {
            db_id: {
              type: "string",
              description: "The ID of the BlazeSQL database connection to query."
            },
            natural_language_request: {
              type: "string",
              description: "The query expressed in natural language (e.g., 'show me total users per city')."
            }
          },
          required: ["db_id", "natural_language_request"]
        },
        // Define output schema if possible, though it's dynamic based on query
        // outputSchema: { ... }
      }
    ]
  };
});

/**
 * Handler for the blazesql_query tool.
 * Takes db_id and natural_language_request, calls BlazeSQL API, and returns results.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "blazesql_query": {
      const args = request.params.arguments;
      const db_id = args?.db_id;
      const natural_language_request = args?.natural_language_request;

      // Validate input
      if (typeof db_id !== 'string' || !db_id) {
        throw new Error("Missing or invalid 'db_id' argument.");
      }
      if (typeof natural_language_request !== 'string' || !natural_language_request) {
        throw new Error("Missing or invalid 'natural_language_request' argument.");
      }

      console.log(`Executing BlazeSQL query for DB ID: ${db_id}`);
      console.log(`Natural Language Request: "${natural_language_request}"`);

      // Call the BlazeSQL API function
      const result: BlazeSQLResponse = await queryBlazeSQL(db_id, natural_language_request, apiKey); // apiKey is guaranteed non-null by check above

      if (result.success) {
        // Format successful response for MCP
        console.log("BlazeSQL query successful.");
        return {
          content: [
            {
              type: "text",
              text: result.agent_response // Natural language summary from Blaze
            },
            {
              type: "code",
              language: "sql",
              code: result.query // The generated SQL query
            },
            {
                type: "json",
                // Note: JSON stringify is needed as MCP content expects string
                json: JSON.stringify(result.data_result, null, 2) // The actual data result
            }
          ]
        };
      } else {
        // Handle API errors
        console.error(`BlazeSQL API Error (Code ${result.error_code}): ${result.error}`);
        throw new Error(`BlazeSQL API Error: ${result.error}`); // Throw error to be caught by MCP server framework
      }
    }

    default:
      console.error(`Unknown tool called: ${request.params.name}`);
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Optional: Implement later if needed
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.warn("ListPromptsRequestSchema not implemented yet.");
  return { prompts: [] };
});

// Optional: Implement later if needed
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  console.warn("GetPromptRequestSchema not implemented yet.");
  throw new Error("Prompt handling not implemented.");
});


// --- Server Startup ---
console.log("BlazeSQL MCP Server configuring...");

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  console.log("Connecting transport...");
  await server.connect(transport);
  console.log("BlazeSQL MCP Server is running and connected via stdio.");
}

main().catch((error) => {
  console.error("Server encountered fatal error:", error);
  process.exit(1);
});
