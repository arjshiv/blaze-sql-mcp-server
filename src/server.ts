import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { BlazeSQLResponse, queryBlazeSQL } from "./blazesql.js";
import { SERVER_NAME, SERVER_VERSION, QUERY_TOOL_NAME } from "./metadata.js";
import { formatBlazeSqlSuccess } from "./output.js";

export function createBlazeSqlServer(apiKey: string): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.tool(
    QUERY_TOOL_NAME,
    {
      db_id: z
        .string()
        .describe("The ID of the BlazeSQL database connection to query."),
      natural_language_request: z
        .string()
        .describe(
          "The query expressed in natural language (e.g., 'show me total users per city').",
        ),
    },
    async (params) => {
      console.error("[server] Entered blazesql_query tool handler");
      const toolStartTime = Date.now();
      const { db_id, natural_language_request } = params;

      console.error(`[server] Executing BlazeSQL query for DB ID: ${db_id}`);
      console.error(`[server] Natural Language Request: "${natural_language_request}"`);

      const result: BlazeSQLResponse = await queryBlazeSQL(
        db_id,
        natural_language_request,
        apiKey,
      );

      console.error("[server] queryBlazeSQL returned. Success:", result.success);

      if (result.success) {
        console.error(
          `[server] Tool execution completed in ${Date.now() - toolStartTime}ms`,
        );

        return {
          content: [
            {
              type: "text" as const,
              text: formatBlazeSqlSuccess(result),
            },
          ],
        };
      }

      console.error(
        `[server] BlazeSQL API Error (Code ${result.error_code}): ${result.error}`,
      );
      console.error(
        `[server] Tool execution completed in ${Date.now() - toolStartTime}ms`,
      );

      return {
        content: [{ type: "text" as const, text: `BlazeSQL API Error: ${result.error}` }],
        isError: true,
      };
    },
  );

  return server;
}
