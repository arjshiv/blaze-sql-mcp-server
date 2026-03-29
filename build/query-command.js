import { queryBlazeSQL } from "./blazesql.js";
import { formatBlazeSqlSuccess } from "./output.js";
function formatPlainText(value) {
    return value.replace(/\*\*/g, "").replace(/```(?:json|sql)?\n?/g, "").trimEnd();
}
export async function runDirectQuery(config, logger, options) {
    const result = await queryBlazeSQL(options.dbId, options.naturalLanguageRequest, config.apiKey, {
        endpoint: config.endpoint,
        requestTimeoutMs: config.requestTimeoutMs,
    });
    if (result.success) {
        const formattedResult = formatBlazeSqlSuccess(result, config.maxResponseChars);
        logger.info("Direct BlazeSQL query completed", {
            dbId: options.dbId,
            truncated: formattedResult.wasTruncated,
        });
        if (options.format === "json") {
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
            return 0;
        }
        if (options.format === "text") {
            process.stdout.write(`${formatPlainText(formattedResult.text)}\n`);
            return 0;
        }
        process.stdout.write(formattedResult.text);
        return 0;
    }
    process.stderr.write(`BlazeSQL API Error: ${result.error}\n`);
    return 1;
}
