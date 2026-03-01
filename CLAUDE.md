# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server that proxies natural language database queries to the BlazeSQL API. MCP-compatible clients (Cursor, Claude, MCP Inspector) connect via stdio transport, send natural language queries with a `db_id`, and receive formatted Markdown results containing the agent response, generated SQL, and data.

## Build & Run Commands

```bash
pnpm run build              # TypeScript compile to build/
pnpm run watch              # TypeScript compile in watch mode
pnpm run inspector          # Launch MCP Inspector against build/index.js
pnpm run build-and-inspect  # Build then launch inspector
node build/index.js         # Run the server directly
```

Package manager: **pnpm** (scripts use `pnpm run`). No test framework is configured.

## Architecture

Two-file TypeScript server (`src/`):

- **`src/index.ts`** — Server entry point. Loads `BLAZE_API_KEY` from env, creates `McpServer` instance, registers the `blazesql_query` tool with Zod input validation (`db_id`, `natural_language_request`), formats responses as Markdown text blocks, connects via `StdioServerTransport`.
- **`src/blazesql.ts`** — API client. Exports `queryBlazeSQL()` which POSTs to `https://api.blazesql.com/natural_language_query_api`. Defines `BlazeSQLResponse` discriminated union (`BlazeSQLSuccessResponse | BlazeSQLErrorResponse`). Never throws — always returns a structured response.

Build output goes to `build/` (ES2022 target, Node16 module resolution).

## BlazeSQL API Details

- Endpoint: `POST https://api.blazesql.com/natural_language_query_api`
- Auth: `api_key` in request body (sourced from `BLAZE_API_KEY` env var)
- Required params: `db_id`, `natural_language_request`, `api_key`
- Rate limit: 60 requests/hour, 8-minute timeout
- Error codes: 400, 401, 403, 404, 500, 504
- Docs: https://help.blazesql.com/en/article/natural-language-query-api-1fgx4au/

## Key Dependencies

- `@modelcontextprotocol/sdk` ^1.11.0 — `McpServer` and `StdioServerTransport`
- `zod` — Tool input schema validation
- `node-fetch` — HTTP client for BlazeSQL API
- `dotenv` — Loads `.env` at startup

## MCPorter Integration

Project-level mcporter config lives at `config/mcporter.json`. MCPorter auto-discovers this when run from the project root. It defines the `blazesql` server entry pointing to `node build/index.js` with `BLAZE_API_KEY` interpolated from the environment. No code changes are needed for mcporter compatibility — it works with any standard MCP stdio server.

## Environment Setup

Copy `.env.sample` to `.env` and set `BLAZE_API_KEY`. The server exits immediately if the key is missing.
