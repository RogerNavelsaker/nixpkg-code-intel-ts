#!/usr/bin/env bun
import process from "node:process";
import { callLspService, commandExists, fail, parseCommonArgs, printOutput, serveLsp } from "./code-intel-shared.ts";

const config = {
  name: "typescript-language-server",
  command: ["typescript-language-server", "--stdio"],
  port: Number(process.env.TS_CODE_INTEL_PORT ?? 33102),
  languageId: "typescript",
};

const { args, json } = parseCommonArgs(process.argv.slice(2));
const [command, ...rest] = args;
if (!command) fail("usage", "Usage: bun lsp.ts <serve|definition|references|hover|diagnostics|calls> ...", json);

if (command === "serve") {
  if (!commandExists(config.command[0])) fail("missing_language_server", "typescript-language-server is not installed. Add it to flox and activate the environment.", json);
  await serveLsp(config);
  process.stdin.resume();
} else {
  const payload = toPayload(command, rest, json);
  const data = await callLspService(config, payload, json);
  printOutput(data, json);
}

function toPayload(command: string, rest: string[], json: boolean) {
  switch (command) {
    case "definition":
    case "references":
    case "hover":
      if (rest.length < 3) fail("usage", `Usage: bun lsp.ts ${command} <file> <line> <col>`, json);
      return { method: command, file: rest[0], line: Number(rest[1]), col: Number(rest[2]) };
    case "diagnostics":
      if (rest.length < 1) fail("usage", "Usage: bun lsp.ts diagnostics <file>", json);
      return { method: command, file: rest[0] };
    case "calls": {
      if (rest.length < 3) fail("usage", "Usage: bun lsp.ts calls <file> <line> <col> [--direction in|out]", json);
      const directionIndex = rest.indexOf("--direction");
      const direction = directionIndex >= 0 ? rest[directionIndex + 1] : "in";
      return { method: command, file: rest[0], line: Number(rest[1]), col: Number(rest[2]), direction };
    }
    default:
      fail("usage", `Unknown lsp command: ${command}`, json);
  }
}
