import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryBlazeSQL } from "./blazesql.js";
import { SERVER_NAME, SERVER_VERSION, QUERY_TOOL_NAME } from "./metadata.js";
import { formatBlazeSqlSuccess } from "./output.js";
export function createBlazeSqlServer(config, logger) {
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });
    server.tool(QUERY_TOOL_NAME, {
        db_id: z
            .string()
            .describe("The ID of the BlazeSQL database connection to query."),
        natural_language_request: z
            .string()
            .describe("The query expressed in natural language (e.g., 'show me total users per city')."),
    }, async (params) => {
        const toolStartTime = Date.now();
        const { db_id, natural_language_request } = params;
        logger.debug("Received BlazeSQL query request", {
            dbId: db_id,
            requestLength: natural_language_request.length,
        });
        const result = await queryBlazeSQL(db_id, natural_language_request, config.apiKey, {
            endpoint: config.endpoint,
            requestTimeoutMs: config.requestTimeoutMs,
        });
        if (result.success) {
            const formattedResult = formatBlazeSqlSuccess(result, config.maxResponseChars);
            logger.info("BlazeSQL query completed successfully", {
                dbId: db_id,
                durationMs: Date.now() - toolStartTime,
                truncated: formattedResult.wasTruncated,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: formattedResult.text,
                    },
                ],
            };
        }
        logger.error("BlazeSQL query failed", {
            dbId: db_id,
            durationMs: Date.now() - toolStartTime,
            errorCode: result.error_code,
            error: result.error,
        });
        return {
            content: [{ type: "text", text: `BlazeSQL API Error: ${result.error}` }],
            isError: true,
        };
    });
    return server;
}
