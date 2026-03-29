import { queryBlazeSQL } from "./blazesql.js";
import { formatBlazeSqlSuccess } from "./output.js";
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
        process.stdout.write(formattedResult.text);
        return 0;
    }
    process.stderr.write(`BlazeSQL API Error: ${result.error}\n`);
    return 1;
}
