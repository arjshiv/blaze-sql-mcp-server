#!/usr/bin/env node

/**
 * MCP Server for interacting with the BlazeSQL Natural Language Query API.
 * Exposes the BlazeSQL query functionality as an MCP tool.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResultSchema,
  ListToolsResultSchema, // Corrected type name
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
console.error("API Key loaded successfully.");

// --- Tool Registration Function ---

function registerBlazeSQLTool(server: Server) {
  const blazeSQLToolDefinition = {
    name: "blazesql_query",
    description: "Executes a natural language query against a specified BlazeSQL database.",
    inputSchema: {
      type: "object",
      properties: {
        db_id: { type: "string", description: "The ID of the BlazeSQL database connection to query." },
        natural_language_request: { type: "string", description: "The query expressed in natural language (e.g., 'show me total users per city')." }
      },
      required: ["db_id", "natural_language_request"]
    }
  };

  // Handler to list *only* this tool
  // Note: For multiple tools registered this way, a more complex pattern is needed here.
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("ListTools request received. Advertising blazesql_query tool via registration function.");
    return {
      tools: [ blazeSQLToolDefinition ]
    };
  });

  // Handler to call *only* this tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== blazeSQLToolDefinition.name) {
        // If this handler receives a call for a different tool, ignore it (or throw)
        // This check is important if multiple registration functions are used.
        console.error(`CallTool request received for unknown tool '${request.params.name}' within BlazeSQL registration.`)
        throw new Error(`Tool '${request.params.name}' not handled by BlazeSQL registration.`);
    }

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

    console.error(`Executing BlazeSQL query for DB ID: ${db_id}`);
    console.error(`Natural Language Request: "${natural_language_request}"`);

    // Call the BlazeSQL API function - Assert apiKey is not null
    const result: BlazeSQLResponse = await queryBlazeSQL(db_id, natural_language_request, apiKey!);

    if (result.success) {
      console.error("BlazeSQL query successful. Returning structured object as compact string within content[type=text].");
      const structuredResult = {
        agent_response: result.agent_response,
        query: result.query,
        data_result: result.data_result
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(structuredResult)
          }
        ]
      };
    } else {
      // Handle API errors
      console.error(`BlazeSQL API Error (Code ${result.error_code}): ${result.error}`);
      throw new Error(`BlazeSQL API Error: ${result.error}`);
    }
  });

  console.error(`Tool '${blazeSQLToolDefinition.name}' registered.`);
}

// --- Server Initialization ---
const server = new Server(
  {
    name: "BlazeSQL MCP Server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Register Tools ---
registerBlazeSQLTool(server);
// Add calls to other registerXTool(server) functions here if needed

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
