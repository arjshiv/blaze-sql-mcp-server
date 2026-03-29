import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_NAME } from "./metadata.js";
import { createBlazeSqlServer } from "./server.js";
export async function startStdioServer(config, logger) {
    const server = createBlazeSqlServer(config, logger);
    const transport = new StdioServerTransport();
    logger.info(`${SERVER_NAME} configuring`);
    await server.connect(transport);
    logger.info(`${SERVER_NAME} is running and connected via stdio`);
}
