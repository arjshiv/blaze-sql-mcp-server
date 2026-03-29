import "dotenv/config";

export type LogLevel = "error" | "info" | "debug";

export interface RuntimeConfig {
  apiKey: string;
  logLevel: LogLevel;
  maxResponseChars: number;
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

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  envName: string,
  min: number,
  max: number,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < min || parsedValue > max) {
    throw new Error(`${envName} must be an integer between ${min} and ${max}.`);
  }

  return parsedValue;
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
    maxResponseChars: parsePositiveInteger(
      env.BLAZE_MAX_RESPONSE_CHARS,
      20_000,
      "BLAZE_MAX_RESPONSE_CHARS",
      1_000,
      200_000,
    ),
  };
}
