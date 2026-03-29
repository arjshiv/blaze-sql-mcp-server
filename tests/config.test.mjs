import assert from "node:assert/strict";
import test from "node:test";

import { inspectRuntimeConfig, loadRuntimeConfig } from "../build/config.js";

test("loadRuntimeConfig returns defaults for a valid environment", () => {
  const config = loadRuntimeConfig({
    BLAZE_API_KEY: "test-key",
  });

  assert.equal(config.apiKey, "test-key");
  assert.equal(config.endpoint, "https://api.blazesql.com/natural_language_query_api");
  assert.equal(config.logLevel, "error");
  assert.equal(config.maxResponseChars, 20_000);
  assert.equal(config.requestTimeoutMs, 15_000);
});

test("loadRuntimeConfig rejects insecure non-loopback endpoints", () => {
  assert.throws(
    () =>
      loadRuntimeConfig({
        BLAZE_API_KEY: "test-key",
        BLAZE_API_ENDPOINT: "http://example.com/api",
      }),
    /HTTPS/,
  );
});

test("inspectRuntimeConfig reports validation errors without throwing", () => {
  const health = inspectRuntimeConfig({
    BLAZE_API_ENDPOINT: "http://example.com/api",
    BLAZE_LOG_LEVEL: "verbose",
  });

  assert.equal(health.ok, false);
  assert.equal(health.values.apiKeyPresent, false);
  assert.match(health.errors.join("\n"), /BLAZE_API_KEY is missing/);
  assert.match(health.errors.join("\n"), /BLAZE_LOG_LEVEL must be one of/);
});
