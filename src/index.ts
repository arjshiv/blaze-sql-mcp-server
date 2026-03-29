#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getRequiredApiKey } from "./config.js";
import { SERVER_NAME } from "./metadata.js";
import { createBlazeSqlServer } from "./server.js";

/**
 * Start the server using stdio transport.
 */
async function main() {
  const apiKey = getRequiredApiKey();
  const server = createBlazeSqlServer(apiKey);
  const transport = new StdioServerTransport();

  console.error(`${SERVER_NAME} configuring...`);
  await server.connect(transport);
  console.error(`${SERVER_NAME} is running and connected via stdio.`);
}

main().catch((error) => {
  console.error("Server encountered fatal error:", error);
  process.exit(1);
});
