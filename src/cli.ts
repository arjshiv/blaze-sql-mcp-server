import { parseArgs } from "node:util";

import { loadRuntimeConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { CLI_NAME, SERVER_NAME, SERVER_VERSION } from "./metadata.js";
import { runDirectQuery } from "./query-command.js";
import { startStdioServer } from "./serve.js";

function renderHelp(): string {
  return `${SERVER_NAME}

Usage:
  ${CLI_NAME} serve
  ${CLI_NAME} query --db-id <id> --request <text>
  ${CLI_NAME} --help
  ${CLI_NAME} --version

Commands:
  serve      Start the MCP server over stdio.
  query      Execute a BlazeSQL natural-language request directly.
  help       Show this help text.
  version    Print the CLI version.
`;
}

function isHelpFlag(argument: string | undefined): boolean {
  return argument === "-h" || argument === "--help";
}

function isVersionFlag(argument: string | undefined): boolean {
  return argument === "-v" || argument === "--version";
}

function renderQueryHelp(): string {
  return `Usage:
  ${CLI_NAME} query --db-id <id> --request <text>

Options:
  --db-id <id>        BlazeSQL database ID to query.
  --request <text>    Natural-language request to send to BlazeSQL.
`;
}

export async function runCli(argv: string[]): Promise<number> {
  const command = argv[0];

  if (!command || isHelpFlag(command) || command === "help") {
    process.stdout.write(renderHelp());
    return 0;
  }

  if (isVersionFlag(command) || command === "version") {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return 0;
  }

  if (command === "serve") {
    const config = loadRuntimeConfig();
    const logger = createLogger(config.logLevel);

    await startStdioServer(config, logger);
    return 0;
  }

  if (command === "query") {
    const parsedArgs = parseArgs({
      args: argv.slice(1),
      allowPositionals: false,
      options: {
        "db-id": {
          type: "string",
        },
        request: {
          type: "string",
        },
        help: {
          type: "boolean",
          short: "h",
        },
      },
    });

    if (parsedArgs.values.help) {
      process.stdout.write(renderQueryHelp());
      return 0;
    }

    if (!parsedArgs.values["db-id"] || !parsedArgs.values.request) {
      process.stderr.write(`Missing required options.\n\n${renderQueryHelp()}`);
      return 1;
    }

    const config = loadRuntimeConfig();
    const logger = createLogger(config.logLevel);
    return runDirectQuery(config, logger, {
      dbId: parsedArgs.values["db-id"],
      naturalLanguageRequest: parsedArgs.values.request,
    });
  }

  process.stderr.write(`Unknown command: ${command}\n\n${renderHelp()}`);
  return 1;
}
