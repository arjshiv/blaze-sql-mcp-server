import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryBlazeSQL } from "./blazesql.js";
import { SERVER_NAME, SERVER_VERSION, QUERY_TOOL_NAME } from "./metadata.js";
import { formatBlazeSqlSuccess } from "./output.js";
export function createBlazeSqlServer(apiKey, logger) {
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
        const result = await queryBlazeSQL(db_id, natural_language_request, apiKey);
        if (result.success) {
            logger.info("BlazeSQL query completed successfully", {
                dbId: db_id,
                durationMs: Date.now() - toolStartTime,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: formatBlazeSqlSuccess(result),
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
