import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const buildIndexPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../build/index.js",
);

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [buildIndexPath, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

test("cli prints help", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /doctor/);
});

test("cli prints version", () => {
  const result = runCli(["--version"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^0\.2\.0/m);
});

test("doctor emits json diagnostics", () => {
  const result = runCli(["doctor", "--json"], {
    BLAZE_API_KEY: "test-key-1234",
  });

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.values.apiKeyPresent, true);
  assert.match(payload.values.apiKeyPreview, /\*+1234$/);
});

test("query fails cleanly when required arguments are missing", () => {
  const result = runCli(["query"], {
    BLAZE_API_KEY: "test-key-1234",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required options/);
});
