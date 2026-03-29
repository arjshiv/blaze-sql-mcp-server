import type { LogLevel } from "./config.js";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  info: 1,
  debug: 2,
};

export interface Logger {
  error(message: string, details?: Record<string, unknown>): void;
  info(message: string, details?: Record<string, unknown>): void;
  debug(message: string, details?: Record<string, unknown>): void;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value.length <= 160 ? value : `${value.slice(0, 157)}...`;
}

function serializeDetails(details: Record<string, unknown> | undefined): string {
  if (!details || Object.keys(details).length === 0) {
    return "";
  }

  const sanitizedEntries = Object.entries(details).map(([key, value]) => [
    key,
    sanitizeValue(value),
  ]);

  return ` ${JSON.stringify(Object.fromEntries(sanitizedEntries))}`;
}

export function createLogger(level: LogLevel): Logger {
  const shouldLog = (candidate: LogLevel): boolean =>
    LEVEL_PRIORITY[candidate] <= LEVEL_PRIORITY[level];

  return {
    error(message, details) {
      if (shouldLog("error")) {
        console.error(`[error] ${message}${serializeDetails(details)}`);
      }
    },
    info(message, details) {
      if (shouldLog("info")) {
        console.error(`[info] ${message}${serializeDetails(details)}`);
      }
    },
    debug(message, details) {
      if (shouldLog("debug")) {
        console.error(`[debug] ${message}${serializeDetails(details)}`);
      }
    },
  };
}
