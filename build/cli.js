import { parseArgs } from "node:util";
import { loadRuntimeConfig } from "./config.js";
import { runDoctorCommand } from "./doctor-command.js";
import { createLogger } from "./logger.js";
import { CLI_NAME, SERVER_NAME, SERVER_VERSION } from "./metadata.js";
import { runDirectQuery } from "./query-command.js";
import { startStdioServer } from "./serve.js";
function renderHelp() {
    return `${SERVER_NAME}

Usage:
  ${CLI_NAME} serve
  ${CLI_NAME} query --db-id <id> --request <text>
  ${CLI_NAME} doctor [--json]
  ${CLI_NAME} --help
  ${CLI_NAME} --version

Commands:
  serve      Start the MCP server over stdio.
  query      Execute a BlazeSQL natural-language request directly.
  doctor     Check runtime configuration and print a safe diagnostic summary.
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
function renderQueryHelp() {
    return `Usage:
  ${CLI_NAME} query --db-id <id> --request <text>
  ${CLI_NAME} query <id> <text>

Options:
  --db-id <id>        BlazeSQL database ID to query.
  --request <text>    Natural-language request to send to BlazeSQL.
  --format <type>     One of: markdown, text, json.
  --stdin             Read the request body from stdin.
`;
}
function renderDoctorHelp() {
    return `Usage:
  ${CLI_NAME} doctor [--json]

Options:
  --json              Emit diagnostic details as JSON.
`;
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
    if (command === "query") {
        const parsedArgs = parseArgs({
            args: argv.slice(1),
            allowPositionals: true,
            options: {
                "db-id": {
                    type: "string",
                },
                format: {
                    type: "string",
                },
                request: {
                    type: "string",
                },
                help: {
                    type: "boolean",
                    short: "h",
                },
                stdin: {
                    type: "boolean",
                },
            },
        });
        if (parsedArgs.values.help) {
            process.stdout.write(renderQueryHelp());
            return 0;
        }
        const dbId = parsedArgs.values["db-id"] ?? parsedArgs.positionals[0];
        let naturalLanguageRequest = parsedArgs.values.request ?? parsedArgs.positionals.slice(1).join(" ").trim();
        if (!naturalLanguageRequest && (parsedArgs.values.stdin || !process.stdin.isTTY)) {
            naturalLanguageRequest = await new Promise((resolve, reject) => {
                const chunks = [];
                process.stdin.on("data", (chunk) => {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                process.stdin.on("end", () => {
                    resolve(Buffer.concat(chunks).toString("utf8").trim());
                });
                process.stdin.on("error", reject);
            });
        }
        const outputFormat = parsedArgs.values.format ?? "markdown";
        if (!["markdown", "text", "json"].includes(outputFormat)) {
            process.stderr.write(`Invalid --format value: ${outputFormat}\n\n${renderQueryHelp()}`);
            return 1;
        }
        if (!dbId || !naturalLanguageRequest) {
            process.stderr.write(`Missing required options.\n\n${renderQueryHelp()}`);
            return 1;
        }
        const config = loadRuntimeConfig();
        const logger = createLogger(config.logLevel);
        return runDirectQuery(config, logger, {
            dbId,
            format: outputFormat,
            naturalLanguageRequest,
        });
    }
    if (command === "doctor") {
        const parsedArgs = parseArgs({
            args: argv.slice(1),
            allowPositionals: false,
            options: {
                json: {
                    type: "boolean",
                },
                help: {
                    type: "boolean",
                    short: "h",
                },
            },
        });
        if (parsedArgs.values.help) {
            process.stdout.write(renderDoctorHelp());
            return 0;
        }
        return runDoctorCommand({
            json: parsedArgs.values.json ?? false,
        });
    }
    process.stderr.write(`Unknown command: ${command}\n\n${renderHelp()}`);
    return 1;
}
