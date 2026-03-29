import { loadRuntimeConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { CLI_NAME, SERVER_NAME, SERVER_VERSION } from "./metadata.js";
import { startStdioServer } from "./serve.js";
function renderHelp() {
    return `${SERVER_NAME}

Usage:
  ${CLI_NAME} serve
  ${CLI_NAME} --help
  ${CLI_NAME} --version

Commands:
  serve      Start the MCP server over stdio.
  help       Show this help text.
  version    Print the CLI version.
`;
}
function isHelpFlag(argument) {
    return argument === "-h" || argument === "--help";
}
function isVersionFlag(argument) {
    return argument === "-v" || argument === "--version";
}
export async function runCli(argv) {
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
    process.stderr.write(`Unknown command: ${command}\n\n${renderHelp()}`);
    return 1;
}
