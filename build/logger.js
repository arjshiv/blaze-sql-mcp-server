const LEVEL_PRIORITY = {
    error: 0,
    info: 1,
    debug: 2,
};
function sanitizeValue(value) {
    if (typeof value !== "string") {
        return value;
    }
    return value.length <= 160 ? value : `${value.slice(0, 157)}...`;
}
function serializeDetails(details) {
    if (!details || Object.keys(details).length === 0) {
        return "";
    }
    const sanitizedEntries = Object.entries(details).map(([key, value]) => [
        key,
        sanitizeValue(value),
    ]);
    return ` ${JSON.stringify(Object.fromEntries(sanitizedEntries))}`;
}
export function createLogger(level) {
    const shouldLog = (candidate) => LEVEL_PRIORITY[candidate] <= LEVEL_PRIORITY[level];
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
