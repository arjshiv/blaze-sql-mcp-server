#!/usr/bin/env node

import { runCli } from "./cli.js";

runCli(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error("Server encountered fatal error:", error);
    process.exitCode = 1;
  });
