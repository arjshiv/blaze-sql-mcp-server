# BlazeSQL MCP Server

`blaze-sql-server` is a secure-by-default MCP server and CLI for the BlazeSQL natural-language query API.

It supports two modes:

- `serve`: run as an MCP stdio server for Cursor, Claude Desktop, Codex, and other MCP clients
- `query`: execute a single BlazeSQL request directly from the shell

## Highlights

- MCP tool: exposes `blazesql_query`
- CLI commands: `serve`, `query`, `doctor`, `help`, `version`
- Security defaults: HTTPS-only remote endpoints, bounded timeouts, redacted logging, capped formatted output
- Validation: runtime config validation plus BlazeSQL response-shape validation
- Tooling: `pnpm`, CI, and automated tests via the Node test runner

## Requirements

- Node.js `>=20.11.0`
- `pnpm` `>=10`
- A BlazeSQL API key

## Install

```bash
pnpm install
cp .env.sample .env
```

Set at least:

```dotenv
BLAZE_API_KEY=YOUR_API_KEY_HERE
```

Optional environment variables:

- `BLAZE_API_ENDPOINT`
- `BLAZE_REQUEST_TIMEOUT_MS`
- `BLAZE_MAX_RESPONSE_CHARS`
- `BLAZE_LOG_LEVEL`
- `BLAZE_ALLOW_INSECURE_ENDPOINT`

## Build

```bash
pnpm build
```

## Run As MCP Server

For backward compatibility, running the binary with no arguments starts the stdio server:

```bash
node build/index.js
```

Explicitly:

```bash
node build/index.js serve
```

The exposed MCP tool is:

- `blazesql_query`

Arguments:

- `db_id`: BlazeSQL database ID
- `natural_language_request`: the prompt to send to BlazeSQL

## Run As CLI

Print help:

```bash
node build/index.js --help
```

Run a direct query:

```bash
node build/index.js query --db-id db_demo --request "show me total users by city"
```

Use positional arguments:

```bash
node build/index.js query db_demo "show me total users by city"
```

Read the request from stdin:

```bash
printf 'show me total users by city\n' | node build/index.js query db_demo --stdin
```

Available output formats:

```bash
node build/index.js query db_demo "show me total users by city" --format markdown
node build/index.js query db_demo "show me total users by city" --format text
node build/index.js query db_demo "show me total users by city" --format json
```

## Diagnostics

Check runtime configuration:

```bash
node build/index.js doctor
node build/index.js doctor --json
```

`doctor` is safe to run in shared terminals: it never prints the raw API key.

## Validate

```bash
pnpm typecheck
pnpm test
pnpm check
```

## MCP Client Configuration

Example stdio command:

```bash
/absolute/path/to/node /absolute/path/to/blaze-sql-mcp-server/build/index.js
```

Because the binary defaults to `serve`, MCP clients do not need an extra subcommand.

## Design Notes

The CLI shape intentionally follows the same single-purpose command pattern popularized by tools like `mcporter`: a predictable command surface, direct shell usage, and one obvious machine-readable mode where it matters.
