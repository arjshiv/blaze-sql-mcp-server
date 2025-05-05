# BlazeSQL MCP Server

This project implements a Model Context Protocol (MCP) server that acts as a proxy to the BlazeSQL Natural Language Query API. It allows MCP-compatible clients (like Cursor, Claude 3 with tool use, the MCP Inspector, etc.) to interact with BlazeSQL using natural language.

<a href="https://glama.ai/mcp/servers/@arjshiv/blaze-sql-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@arjshiv/blaze-sql-mcp-server/badge" alt="BlazeSQL Server MCP server" />
</a>

## Features

*   Exposes the BlazeSQL Natural Language Query API as an MCP tool named `blazesql_query`.
*   Handles API key authentication securely via environment variables.
*   Communicates with clients using the standard MCP stdio transport.

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Yarn](https://yarnpkg.com/) (Classic or Berry)
*   A BlazeSQL account with an API Key (Team Advanced subscription required for the API).
*   At least one database connection configured in your BlazeSQL account.

## Setup

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd blaze-sql-mcp-server
    ```

2.  **Install Dependencies:**
    ```bash
    yarn install
    ```

3.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.sample .env
        ```
    *   Edit the `.env` file:
        ```dotenv
        # .env
        BLAZE_API_KEY=YOUR_BLAZESQL_API_KEY_HERE
        ```
        Replace `YOUR_BLAZESQL_API_KEY_HERE` with your actual API key obtained from your BlazeSQL account settings.

## Running the Server

1.  **Build the Server:**
    Compile the TypeScript code to JavaScript:
    ```bash
    yarn build
    ```

2.  **Run the Server:**
    Execute the compiled code:
    ```bash
    node build/index.js
    ```
    The server will start and log messages to `stderr` (you might see "API Key loaded successfully..." etc.). It is now listening for an MCP client connection via standard input/output (stdio).

## Connecting an MCP Client

This server uses the **stdio** transport mechanism.

### Using the MCP Inspector (Recommended for Testing)

1.  Make sure the server is **not** already running separately.
2.  Run the Inspector, telling it to launch your server:
    ```bash
    npx @modelcontextprotocol/inspector node build/index.js
    ```
3.  The Inspector UI will launch, automatically connecting to your server.
4.  Navigate to the "Tools" tab to interact with the `blazesql_query` tool.

### Using Integrated Clients (Cursor, Claude 3, etc.)

1.  **Start the server** in a terminal:
    ```bash
    node build/index.js
    ```
2.  **Configure the client:** In your MCP client's settings, you need to add a custom server configuration.
    *   **Transport:** Select `stdio`.
    *   **Command:** Specify the exact command used to run the server. You need to provide the **absolute path** to node and the **absolute path** to the `build/index.js` file.
        *   Example (macOS/Linux - adjust paths as needed):
            `/usr/local/bin/node /Users/your_username/path/to/blaze-sql-mcp-server/build/index.js`
        *   You can find the path to node using `which node` in your terminal.
        *   You can find the path to the project using `pwd` inside the project directory.
    *   Save the configuration.
3.  The client should now be able to connect to your locally running server and list/use its tools.

## Using the `blazesql_query` Tool

Once connected, the client can call the `blazesql_query` tool.

*   **Tool Name:** `blazesql_query`
*   **Arguments:**
    *   `db_id` (string, required): The ID of the target database connection in your BlazeSQL account. You can find this ID in the BlazeSQL web application when managing your database connections.
    *   `natural_language_request` (string, required): The query you want to execute, written in plain English (e.g., "show me the total number of users").

*   **Example Call (using `mcp test` syntax for illustration):**
    ```bash
    call-tool blazesql_query --db_id "db_your_actual_db_id" --natural_language_request "What were the total sales last month?"
    ```

*   **Output:**
    If successful, the tool returns:
    *   A `text` block containing the natural language response from the BlazeSQL agent.
    *   A `code` block (language `sql`) containing the SQL query generated and executed by BlazeSQL.
    *   A `json` block containing the actual data results from the query.
    If unsuccessful, it returns an MCP error message.