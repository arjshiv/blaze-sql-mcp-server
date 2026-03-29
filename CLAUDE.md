# CLAUDE.md

This repository contains a BlazeSQL MCP server and companion CLI.

## Core Commands

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm check
pnpm inspector
node build/index.js
node build/index.js query --db-id db_demo --request "show me total users"
node build/index.js doctor --json
```

## Package Manager

Use `pnpm`.

## Architecture

- `src/index.ts`: CLI entrypoint
- `src/cli.ts`: command routing for `serve`, `query`, `doctor`, `help`, `version`
- `src/serve.ts`: MCP stdio startup and signal handling
- `src/server.ts`: MCP tool registration
- `src/blazesql.ts`: BlazeSQL API client with timeout and response validation
- `src/config.ts`: environment parsing, endpoint policy, and runtime diagnostics
- `src/logger.ts`: redacted stderr logging
- `src/output.ts`: bounded response formatting
- `src/query-command.ts`: direct shell query execution
- `src/doctor-command.ts`: configuration diagnostics

## Generated Output

`build/` is generated and ignored by git. Run `pnpm build` before invoking the CLI directly.

## mcporter

Project-level `mcporter` configuration lives at `config/mcporter.json`.
From the repo root:

```bash
npx mcporter list
npx mcporter call blazesql.blazesql_query db_id:"db_demo" natural_language_request:"show me total users"
```
