#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import 'dotenv/config'; // Load environment variables from .env file
import { queryBlazeSQL } from './blazesql'; // Import the function we created

/**
 * Type alias for a note object.
 */
type Note = { title: string, content: string };

/**
 * Simple in-memory storage for notes.
 * In a real implementation, this would likely be backed by a database.
 */
const notes: { [id: string]: Note } = {
  "1": { title: "First Note", content: "This is note 1" },
  "2": { title: "Second Note", content: "This is note 2" }
};

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "Blaze SQL Server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler for listing available notes as resources.
 * Each note is exposed as a resource with:
 * - A note:// URI scheme
 * - Plain text MIME type
 * - Human readable name and description (now including the note title)
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.entries(notes).map(([id, note]) => ({
      uri: `note:///${id}`,
      mimeType: "text/plain",
      name: note.title,
      description: `A text note: ${note.title}`
    }))
  };
});

/**
 * Handler for reading the contents of a specific note.
 * Takes a note:// URI and returns the note content as plain text.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const id = url.pathname.replace(/^\//, '');
  const note = notes[id];

  if (!note) {
    throw new Error(`Note ${id} not found`);
  }

  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "text/plain",
      text: note.content
    }]
  };
});

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_note",
        description: "Create a new note",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the note"
            },
            content: {
              type: "string",
              description: "Text content of the note"
            }
          },
          required: ["title", "content"]
        }
      }
    ]
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "create_note": {
      const title = String(request.params.arguments?.title);
      const content = String(request.params.arguments?.content);
      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      const id = String(Object.keys(notes).length + 1);
      notes[id] = { title, content };

      return {
        content: [{
          type: "text",
          text: `Created note ${id}: ${title}`
        }]
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Handler that lists available prompts.
 * Exposes a single "summarize_notes" prompt that summarizes all notes.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "summarize_notes",
        description: "Summarize all notes",
      }
    ]
  };
});

/**
 * Handler for the summarize_notes prompt.
 * Returns a prompt that requests summarization of all notes, with the notes' contents embedded as resources.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "summarize_notes") {
    throw new Error("Unknown prompt");
  }

  const embeddedNotes = Object.entries(notes).map(([id, note]) => ({
    type: "resource" as const,
    resource: {
      uri: `note:///${id}`,
      mimeType: "text/plain",
      text: note.content
    }
  }));

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please summarize the following notes:"
        }
      },
      ...embeddedNotes.map(note => ({
        role: "user" as const,
        content: note
      })),
      {
        role: "user",
        content: {
          type: "text",
          text: "Provide a concise summary of all the notes above."
        }
      }
    ]
  };
});

// Retrieve API Key from environment
const apiKey = process.env.BLAZE_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: BLAZE_API_KEY environment variable is not set.");
    console.error("Please create a .env file based on .env.example and add your API key.");
    process.exit(1); // Exit if the key is missing
}

console.log("BlazeSQL MCP Server starting...");
console.log("API Key loaded successfully.");

// --- Placeholder for MCP Server Logic ---
// This is where you would typically start an HTTP server (e.g., using Express)
// and handle incoming MCP requests.

// Example: Define a function to handle an incoming MCP request
async function handleMcpRequest(requestData: any) {
    console.log("\nReceived MCP Request:", JSON.stringify(requestData, null, 2));

    // TODO: Validate requestData against MCP schema

    // Assuming the request contains db_id and natural_language_request
    const { db_id, natural_language_request } = requestData; // Adapt based on actual MCP structure

    if (!db_id || !natural_language_request) {
        console.error("MCP request missing required fields (db_id, natural_language_request).");
        // TODO: Return an MCP error response
        return;
    }

    console.log(`Forwarding query to BlazeSQL API for DB ID: ${db_id}`);
    const blazeResponse = await queryBlazeSQL(db_id, natural_language_request, apiKey);

    console.log("Received response from BlazeSQL API:", JSON.stringify(blazeResponse, null, 2));

    // TODO: Format the blazeResponse into an MCP response structure
    // TODO: Send the MCP response back to the client

    return blazeResponse; // For now, just return the raw Blaze response
}

// --- Example Usage (Simulated Request) ---
// In a real server, this would come from an HTTP request handler
async function runExample() {
    const simulatedMcpRequest = {
        // This structure is hypothetical - adapt based on your MCP definition
        protocolVersion: "1.0",
        requestId: "example-123",
        toolId: "blazesql-query",
        db_id: "YOUR_DB_ID_HERE", // <<< IMPORTANT: Replace with a real DB ID from BlazeSQL
        natural_language_request: "What are the total sales for the last quarter?"
    };

    if (simulatedMcpRequest.db_id === "YOUR_DB_ID_HERE") {
        console.warn("\nPlease update 'YOUR_DB_ID_HERE' in src/index.ts with a real BlazeSQL DB ID to run the example.");
        return;
    }

    await handleMcpRequest(simulatedMcpRequest);
}

// Uncomment to run the example when the script starts:
// runExample();

console.log("Server setup complete. Waiting for incoming requests (or uncomment runExample() to test).");

// Keep the process running (useful for placeholder server logic)
// In a real HTTP server, app.listen() would handle this.
// setInterval(() => {}, 1 << 30); // Keep alive hack, replace with actual server

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
