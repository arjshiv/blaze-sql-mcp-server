import "dotenv/config";
function parseLogLevel(value) {
    switch (value?.trim().toLowerCase()) {
        case undefined:
        case "":
        case "error":
            return "error";
        case "info":
        case "debug":
            return value.trim().toLowerCase();
        default:
            throw new Error("BLAZE_LOG_LEVEL must be one of: error, info, debug.");
    }
}
function parsePositiveInteger(value, fallback, envName, min, max) {
    if (!value?.trim()) {
        return fallback;
    }
    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isInteger(parsedValue) || parsedValue < min || parsedValue > max) {
        throw new Error(`${envName} must be an integer between ${min} and ${max}.`);
    }
    return parsedValue;
}
function parseBoolean(value) {
    if (!value?.trim()) {
        return false;
    }
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
function isLoopbackHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
function parseEndpoint(env) {
    const rawEndpoint = env.BLAZE_API_ENDPOINT?.trim() ??
        "https://api.blazesql.com/natural_language_query_api";
    const allowInsecureEndpoint = parseBoolean(env.BLAZE_ALLOW_INSECURE_ENDPOINT);
    let endpoint;
    try {
        endpoint = new URL(rawEndpoint);
    }
    catch {
        throw new Error("BLAZE_API_ENDPOINT must be a valid absolute URL.");
    }
    if (endpoint.username || endpoint.password) {
        throw new Error("BLAZE_API_ENDPOINT must not include embedded credentials.");
    }
    if (endpoint.protocol !== "https:" &&
        !(endpoint.protocol === "http:" && (allowInsecureEndpoint || isLoopbackHost(endpoint.hostname)))) {
        throw new Error("BLAZE_API_ENDPOINT must use HTTPS unless it targets a loopback host or BLAZE_ALLOW_INSECURE_ENDPOINT=true is set.");
    }
    return endpoint.toString();
}
function maskApiKey(apiKey) {
    if (apiKey.length <= 4) {
        return "****";
    }
    return `${"*".repeat(Math.max(4, apiKey.length - 4))}${apiKey.slice(-4)}`;
}
export function loadRuntimeConfig(env = process.env) {
    const apiKey = env.BLAZE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("BLAZE_API_KEY environment variable is not set. Create a .env file based on .env.sample.");
    }
    return {
        apiKey,
        endpoint: parseEndpoint(env),
        logLevel: parseLogLevel(env.BLAZE_LOG_LEVEL),
        maxResponseChars: parsePositiveInteger(env.BLAZE_MAX_RESPONSE_CHARS, 20_000, "BLAZE_MAX_RESPONSE_CHARS", 1_000, 200_000),
        requestTimeoutMs: parsePositiveInteger(env.BLAZE_REQUEST_TIMEOUT_MS, 15_000, "BLAZE_REQUEST_TIMEOUT_MS", 1_000, 120_000),
    };
}
export function inspectRuntimeConfig(env = process.env) {
    const errors = [];
    const apiKey = env.BLAZE_API_KEY?.trim();
    let endpoint = null;
    let logLevel = null;
    let maxResponseChars = null;
    let requestTimeoutMs = null;
    if (!apiKey) {
        errors.push("BLAZE_API_KEY is missing.");
    }
    try {
        endpoint = parseEndpoint(env);
    }
    catch (error) {
        errors.push(error instanceof Error ? error.message : "Invalid BlazeSQL endpoint.");
    }
    try {
        logLevel = parseLogLevel(env.BLAZE_LOG_LEVEL);
    }
    catch (error) {
        errors.push(error instanceof Error ? error.message : "Invalid log level.");
    }
    try {
        maxResponseChars = parsePositiveInteger(env.BLAZE_MAX_RESPONSE_CHARS, 20_000, "BLAZE_MAX_RESPONSE_CHARS", 1_000, 200_000);
    }
    catch (error) {
        errors.push(error instanceof Error
            ? error.message
            : "Invalid BLAZE_MAX_RESPONSE_CHARS value.");
    }
    try {
        requestTimeoutMs = parsePositiveInteger(env.BLAZE_REQUEST_TIMEOUT_MS, 15_000, "BLAZE_REQUEST_TIMEOUT_MS", 1_000, 120_000);
    }
    catch (error) {
        errors.push(error instanceof Error
            ? error.message
            : "Invalid BLAZE_REQUEST_TIMEOUT_MS value.");
    }
    return {
        ok: errors.length === 0,
        errors,
        values: {
            apiKeyPresent: Boolean(apiKey),
            apiKeyPreview: apiKey ? maskApiKey(apiKey) : null,
            endpoint,
            logLevel,
            maxResponseChars,
            requestTimeoutMs,
        },
    };
}
