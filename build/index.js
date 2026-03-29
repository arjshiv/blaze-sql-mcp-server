#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadRuntimeConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { SERVER_NAME } from "./metadata.js";
import { createBlazeSqlServer } from "./server.js";
/**
 * Start the server using stdio transport.
 */
async function main() {
    const config = loadRuntimeConfig();
    const logger = createLogger(config.logLevel);
    const server = createBlazeSqlServer(config, logger);
    const transport = new StdioServerTransport();
    logger.info(`${SERVER_NAME} configuring`);
    await server.connect(transport);
    logger.info(`${SERVER_NAME} is running and connected via stdio`);
}
main().catch((error) => {
    console.error("Server encountered fatal error:", error);
    process.exit(1);
});
