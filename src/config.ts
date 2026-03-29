import "dotenv/config";

export type LogLevel = "error" | "info" | "debug";

export interface RuntimeConfig {
  apiKey: string;
  endpoint: string;
  logLevel: LogLevel;
  maxResponseChars: number;
  requestTimeoutMs: number;
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

function parseBoolean(value: string | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function parseEndpoint(env: NodeJS.ProcessEnv): string {
  const rawEndpoint =
    env.BLAZE_API_ENDPOINT?.trim() ??
    "https://api.blazesql.com/natural_language_query_api";
  const allowInsecureEndpoint = parseBoolean(env.BLAZE_ALLOW_INSECURE_ENDPOINT);

  let endpoint: URL;

  try {
    endpoint = new URL(rawEndpoint);
  } catch {
    throw new Error("BLAZE_API_ENDPOINT must be a valid absolute URL.");
  }

  if (endpoint.username || endpoint.password) {
    throw new Error("BLAZE_API_ENDPOINT must not include embedded credentials.");
  }

  if (
    endpoint.protocol !== "https:" &&
    !(endpoint.protocol === "http:" && (allowInsecureEndpoint || isLoopbackHost(endpoint.hostname)))
  ) {
    throw new Error(
      "BLAZE_API_ENDPOINT must use HTTPS unless it targets a loopback host or BLAZE_ALLOW_INSECURE_ENDPOINT=true is set.",
    );
  }

  return endpoint.toString();
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
    endpoint: parseEndpoint(env),
    logLevel: parseLogLevel(env.BLAZE_LOG_LEVEL),
    maxResponseChars: parsePositiveInteger(
      env.BLAZE_MAX_RESPONSE_CHARS,
      20_000,
      "BLAZE_MAX_RESPONSE_CHARS",
      1_000,
      200_000,
    ),
    requestTimeoutMs: parsePositiveInteger(
      env.BLAZE_REQUEST_TIMEOUT_MS,
      15_000,
      "BLAZE_REQUEST_TIMEOUT_MS",
      1_000,
      120_000,
    ),
  };
}
