import "dotenv/config";

export type LogLevel = "error" | "info" | "debug";

export interface RuntimeConfig {
  apiKey: string;
  logLevel: LogLevel;
}

function parseLogLevel(value: string | undefined): LogLevel {
  switch (value?.trim().toLowerCase()) {
    case undefined:
    case "":
    case "error":
      return "error";
    case "info":
    case "debug":
      return value.trim().toLowerCase() as LogLevel;
    default:
      throw new Error(
        "BLAZE_LOG_LEVEL must be one of: error, info, debug.",
      );
  }
}

export function loadRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const apiKey = env.BLAZE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "BLAZE_API_KEY environment variable is not set. Create a .env file based on .env.sample.",
    );
  }

  return {
    apiKey,
    logLevel: parseLogLevel(env.BLAZE_LOG_LEVEL),
  };
}
