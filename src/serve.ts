import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import type { RuntimeConfig } from "./config.js";
import type { Logger } from "./logger.js";
import { SERVER_NAME } from "./metadata.js";
import { createBlazeSqlServer } from "./server.js";

export async function startStdioServer(
  config: RuntimeConfig,
  logger: Logger,
): Promise<void> {
  const server = createBlazeSqlServer(config, logger);
  const transport = new StdioServerTransport();

  logger.info(`${SERVER_NAME} configuring`);
  await server.connect(transport);
  logger.info(`${SERVER_NAME} is running and connected via stdio`);
}
