import assert from "node:assert/strict";
import test from "node:test";

import { queryBlazeSQL } from "../build/blazesql.js";

test("queryBlazeSQL returns validated success payloads", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: true,
        agent_response: "Query completed.",
        query: "select 1",
        data_result: [{ value: 1 }],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  const result = await queryBlazeSQL("db_demo", "show me one row", "test-key", {
    endpoint: "https://example.com/api",
    requestTimeoutMs: 1_000,
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.query, "select 1");
    assert.equal(result.agent_response, "Query completed.");
  }
});

test("queryBlazeSQL normalizes non-json upstream responses", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response("<html>nope</html>", {
      status: 502,
      headers: {
        "content-type": "text/html",
      },
    });

  const result = await queryBlazeSQL("db_demo", "show me one row", "test-key", {
    endpoint: "https://example.com/api",
    requestTimeoutMs: 1_000,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /non-JSON/);
    assert.equal(result.error_code, 502);
  }
});

test("queryBlazeSQL reports timeouts clearly", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => {
    const error = new Error("Request timed out");
    error.name = "TimeoutError";
    throw error;
  };

  const result = await queryBlazeSQL("db_demo", "show me one row", "test-key", {
    endpoint: "https://example.com/api",
    requestTimeoutMs: 1_000,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error_code, 408);
    assert.match(result.error, /timed out/i);
  }
});
