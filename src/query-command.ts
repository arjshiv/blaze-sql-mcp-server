import type { RuntimeConfig } from "./config.js";
import type { Logger } from "./logger.js";
import { queryBlazeSQL } from "./blazesql.js";
import { formatBlazeSqlSuccess } from "./output.js";

export interface DirectQueryOptions {
  dbId: string;
  format: QueryOutputFormat;
  naturalLanguageRequest: string;
}

export type QueryOutputFormat = "json" | "markdown" | "text";

function formatPlainText(value: string): string {
  return value.replace(/\*\*/g, "").replace(/```(?:json|sql)?\n?/g, "").trimEnd();
}

export async function runDirectQuery(
  config: RuntimeConfig,
  logger: Logger,
  options: DirectQueryOptions,
): Promise<number> {
  const result = await queryBlazeSQL(
    options.dbId,
    options.naturalLanguageRequest,
    config.apiKey,
    {
      endpoint: config.endpoint,
      requestTimeoutMs: config.requestTimeoutMs,
    },
  );

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
