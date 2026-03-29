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
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info(`${SERVER_NAME} shutting down`, { signal });

    try {
      await server.close();
      process.exitCode = 0;
    } catch (error) {
      logger.error(`${SERVER_NAME} shutdown failed`, {
        signal,
        error: error instanceof Error ? error.message : "Unknown shutdown error",
      });
      process.exitCode = 1;
    }
  };

  logger.info(`${SERVER_NAME} configuring`);
  await server.connect(transport);
  logger.info(`${SERVER_NAME} is running and connected via stdio`);

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}
