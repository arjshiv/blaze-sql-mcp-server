import { inspectRuntimeConfig } from "./config.js";
import { CLI_NAME, SERVER_VERSION } from "./metadata.js";

export interface DoctorCommandOptions {
  json: boolean;
}

function renderDoctorText(): string {
  const health = inspectRuntimeConfig();
  const lines = [
    `CLI: ${CLI_NAME}`,
    `Version: ${SERVER_VERSION}`,
    `Status: ${health.ok ? "ok" : "invalid"}`,
    `API key present: ${health.values.apiKeyPresent ? "yes" : "no"}`,
    `API key preview: ${health.values.apiKeyPreview ?? "n/a"}`,
    `Endpoint: ${health.values.endpoint ?? "invalid"}`,
    `Log level: ${health.values.logLevel ?? "invalid"}`,
    `Request timeout: ${health.values.requestTimeoutMs ?? "invalid"}`,
    `Max response chars: ${health.values.maxResponseChars ?? "invalid"}`,
  ];

  if (health.errors.length > 0) {
    lines.push("", "Errors:");
    for (const error of health.errors) {
      lines.push(`- ${error}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function runDoctorCommand(options: DoctorCommandOptions): number {
  const health = inspectRuntimeConfig();

  if (options.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          cli: CLI_NAME,
          version: SERVER_VERSION,
          ...health,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    process.stdout.write(renderDoctorText());
  }

  return health.ok ? 0 : 1;
}
